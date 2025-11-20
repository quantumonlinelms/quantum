import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const loadingTimeoutRef = useRef(null)
  const initializationStartedRef = useRef(false)

  // Ensure loading is always cleared, even on refresh
  useEffect(() => {
    // If loading is still true after 1.5 seconds, force it to false (silently)
    const forceClearLoading = setTimeout(() => {
      if (loading) {
        setLoading(false)
      }
    }, 1500)

    return () => clearTimeout(forceClearLoading)
  }, [loading])

  // Simple profile fetch with timeout and fallback
  const fetchUserProfile = async (userId) => {
    // First, get session for fallback (do this first so we always have it)
    let sessionData = null
    try {
      const { data: { session } } = await supabase.auth.getSession()
      sessionData = session
    } catch (err) {
      console.warn('Could not get session:', err)
    }

    // Create fallback profile function
    const createFallbackProfile = () => {
      if (sessionData?.user) {
        const metadata = sessionData.user.user_metadata || {}
        const userRole = metadata.role || 'student'
        return {
          id: userId,
          email: sessionData.user.email || '',
          full_name: metadata.full_name || '',
          phone: metadata.phone || '',
          role: userRole,
          approved: userRole === 'admin' ? true : false,
        }
      }
      return null
    }

    // Try to fetch profile with a short timeout
    let timeoutId = null
    let fetchCompleted = false
    
    try {
      // Create a timeout promise that rejects after 1 second (very short timeout)
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          if (!fetchCompleted) {
            reject(new Error('Profile fetch timeout'))
          }
        }, 1000)
      })

      // Race between fetch and timeout
      const fetchPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle() // Use maybeSingle to avoid errors if not found

      const result = await Promise.race([
        fetchPromise.then(result => {
          fetchCompleted = true
          if (timeoutId) clearTimeout(timeoutId)
          return result
        }).catch(err => {
          fetchCompleted = true
          if (timeoutId) clearTimeout(timeoutId)
          throw err
        }),
        timeoutPromise
      ])

      const { data, error } = result

      if (error) {
        // Silently use fallback profile on error (this is expected if profile doesn't exist yet)
        const fallback = createFallbackProfile()
        if (fallback) {
          setUserProfile(fallback)
        } else {
          setUserProfile(null)
        }
        return
      }

      if (data) {
        // Get email from session if not in profile
        if (!data.email && sessionData?.user?.email) {
          data.email = sessionData.user.email
        }
        setUserProfile(data)
      } else {
        // No data found, use fallback
        const fallback = createFallbackProfile()
        setUserProfile(fallback)
      }
    } catch (err) {
      fetchCompleted = true
      if (timeoutId) clearTimeout(timeoutId)
      // On timeout or error, silently use session metadata as fallback (expected behavior)
      const fallback = createFallbackProfile()
      if (fallback) {
        setUserProfile(fallback)
      } else {
        setUserProfile(null)
      }
      // Don't re-throw - we've set a fallback profile
    }
  }

  useEffect(() => {
    let mounted = true
    let initializationComplete = false

    // Set a timeout to ensure loading never stays true forever
    loadingTimeoutRef.current = setTimeout(async () => {
      if (mounted && !initializationComplete) {
        // Silently use fallback - don't log warnings as this is expected behavior
        // Get session and create fallback profile if needed
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user && mounted) {
            const metadata = session.user.user_metadata || {}
            const userRole = metadata.role || 'student'
            setUserProfile({
              id: session.user.id,
              email: session.user.email || '',
              full_name: metadata.full_name || '',
              phone: metadata.phone || '',
              role: userRole,
              approved: userRole === 'admin' ? true : false,
            })
            setUser(session.user)
          } else {
            // No session - clear immediately
            setUser(null)
            setUserProfile(null)
          }
        } catch (err) {
          // Silently handle - fallback will be used
          setUser(null)
          setUserProfile(null)
        } finally {
          if (mounted) {
            setLoading(false)
            initializationComplete = true
          }
        }
      }
    }, 1000) // Reduced to 1 second

    // Check initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (error) {
          console.error('Error getting session:', error)
          setUser(null)
          setUserProfile(null)
          setLoading(false)
          initializationComplete = true
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current)
            loadingTimeoutRef.current = null
          }
          return
        }

        if (session?.user) {
          setUser(session.user)
          // Fetch profile with timeout - don't wait too long
          const profilePromise = fetchUserProfile(session.user.id)
          const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => resolve(null), 800) // 800ms timeout
          })
          
          try {
            await Promise.race([profilePromise, timeoutPromise])
          } catch (err) {
            console.error('Error fetching initial profile:', err)
          }
          
          // Set fallback profile if needed
          if (mounted && !userProfile) {
            const metadata = session.user.user_metadata || {}
            const userRole = metadata.role || 'student'
            setUserProfile({
              id: session.user.id,
              email: session.user.email || '',
              full_name: metadata.full_name || '',
              phone: metadata.phone || '',
              role: userRole,
              approved: userRole === 'admin' ? true : false,
            })
          }
          
          if (mounted) {
            setLoading(false)
            initializationComplete = true
            if (loadingTimeoutRef.current) {
              clearTimeout(loadingTimeoutRef.current)
              loadingTimeoutRef.current = null
            }
          }
        } else {
          // No session - clear loading immediately
          setUser(null)
          setUserProfile(null)
          setLoading(false)
          initializationComplete = true
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current)
            loadingTimeoutRef.current = null
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err)
        if (mounted) {
          setUser(null)
          setUserProfile(null)
          setLoading(false)
          initializationComplete = true
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current)
            loadingTimeoutRef.current = null
          }
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null)
        setUserProfile(null)
        setLoading(false)
        return
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session.user)
        setLoading(true)
        
        // Create fallback profile from session metadata
        const metadata = session.user.user_metadata || {}
        const userRole = metadata.role || 'student'
        // Admins are always approved in fallback
        const fallbackProfile = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: metadata.full_name || '',
          phone: metadata.phone || '',
          role: userRole,
          approved: userRole === 'admin' ? true : false,
        }
        
        // Set fallback immediately so UI can render
        setUserProfile(fallbackProfile)
        
        // Set a timeout to ensure loading always clears
        const loadingTimeout = setTimeout(() => {
          if (mounted) {
            setLoading(false)
          }
        }, 1000)
        
        // Try to fetch real profile with timeout
        const profilePromise = fetchUserProfile(session.user.id)
        const timeoutPromise = new Promise((resolve) => {
          setTimeout(() => resolve(null), 800)
        })
        
        try {
          await Promise.race([profilePromise, timeoutPromise])
          // If fetchUserProfile completed, it will have updated userProfile
          // If it timed out, we already have the fallback profile set
        } catch (err) {
          console.error('Error fetching profile on auth change:', err)
          // Fallback already set above
        } finally {
          clearTimeout(loadingTimeout)
          if (mounted) {
            setLoading(false)
          }
        }
      }
    })

    return () => {
      mounted = false
      initializationComplete = true
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email, password, fullName, phone, selectedTitleId = null) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            role: 'student',
          },
        },
      })
      
      if (error) throw error
      
      // If user was created, try to manually create profile if trigger didn't work
      if (data?.user?.id) {
        // Wait a bit for trigger to run
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single()
        
        // If profile doesn't exist, create it manually
        if (!existingProfile) {
          const profileData = {
            id: data.user.id,
            full_name: fullName,
            phone: phone,
            role: 'student',
            approved: false,
          }
          
          // Add selected_title_id if provided
          if (selectedTitleId) {
            profileData.selected_title_id = selectedTitleId
          }
          
          const { error: profileError } = await supabase
            .from('users')
            .insert(profileData)
          
          if (profileError) {
            console.error('Failed to create user profile manually:', profileError)
            // Don't fail registration - profile can be created later
          }
        } else if (selectedTitleId) {
          // Update existing profile with selected_title_id
          const { error: updateError } = await supabase
            .from('users')
            .update({ selected_title_id: selectedTitleId })
            .eq('id', data.user.id)
          
          if (updateError) {
            console.error('Failed to update user profile with selected title:', updateError)
          }
        }
      }
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signIn = async (emailOrPhone, password) => {
    try {
      // Check if phone number
      let userEmail = emailOrPhone.trim()
      const cleanedPhone = emailOrPhone.replace(/\D/g, '')
      const isPhoneNumber = cleanedPhone.length >= 10 && /^[\d\s\+\-\(\)]+$/.test(emailOrPhone.trim())
      
      if (isPhoneNumber) {
        const { data: emailData, error: rpcError } = await supabase.rpc('get_user_email_by_phone', {
          p_phone: emailOrPhone.trim()
        })
        if (rpcError || !emailData) {
          return { data: null, error: { message: 'Invalid phone number or password.' } }
        }
        userEmail = emailData
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password,
      })

      if (error) {
        return { data: null, error }
      }

      if (!data?.user) {
        return { data: null, error: { message: 'User data not found.' } }
      }

      // Profile will be fetched by onAuthStateChange listener
      // Don't fetch here to avoid race conditions

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setUserProfile(null)
      setLoading(false)
    } catch (error) {
      console.error('Error signing out:', error)
      // Still clear state even if sign out fails
      setUser(null)
      setUserProfile(null)
      setLoading(false)
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    isAdmin: userProfile?.role === 'admin',
    isApproved: userProfile?.approved === true,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
