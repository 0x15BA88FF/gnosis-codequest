import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api';

const splashBg = require('../../assets/images/splash-bg.png');

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, token, isLoading } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    const onShow = (e: { endCoordinates: { height: number } }) =>
      setKeyboardHeight(e.endCoordinates.height);
    const onHide = () => setKeyboardHeight(0);
    const showSub = Keyboard.addListener('keyboardDidShow', onShow);
    const hideSub = Keyboard.addListener('keyboardDidHide', onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!isInputFocused) return;
    const id = setInterval(() => {
      const metrics = Keyboard.metrics();
      setKeyboardHeight(metrics?.height ?? 0);
    }, 100);
    return () => clearInterval(id);
  }, [isInputFocused]);

  if (isLoading || token) {
    return (
      <View style={cn('flex-1 bg-black justify-center items-center')}>
        <ActivityIndicator size="large" color="#e35d1e" />
      </View>
    );
  }

  const handleSignUp = async () => {
    setErrorMsg(null);
    setValidationErrors([]);

    const errors: string[] = [];
    if (!displayName.trim()) errors.push('Display name is required.');
    if (!email.trim()) {
      errors.push('Email is required.');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.push('Please enter a valid email address.');
    }
    if (!password) {
      errors.push('Password is required.');
    } else if (password.length < 8) {
      errors.push('Password must be at least 8 characters long.');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    const url = `${API_BASE_URL}/api/v1/auth/register`;
    console.log('[Gnosis] POST', url, 'body:', { email: email.trim(), displayName: displayName.trim(), password: '***' });
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          displayName: displayName.trim(),
        }),
      });
      console.log('[Gnosis] register response:', response.status, response.statusText, 'url:', response.url);

      const data = await response.json();

      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          setValidationErrors(data.errors);
        } else {
          setErrorMsg(data.detail || 'Failed to register account.');
        }
      } else {
        await login(data.token, {
          id: data.userId,
          email: data.email,
          displayName: data.displayName,
        });
        router.replace('/home' as never);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Cannot connect to server. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={splashBg} style={cn('flex-1')} resizeMode="cover">
      <View style={cn('absolute inset-0 bg-black/25')} />
      <View
        style={[
          cn('flex-1'),
          { paddingBottom: isInputFocused ? keyboardHeight : 0 },
        ]}
      >
        <View style={cn('flex-1 justify-between')}>
          {/* Top Left Back to Welcome Link */}
          <View style={[cn('px-6 flex-row'), { paddingTop: insets.top + 16 }]}>
            <Pressable
              onPress={() => router.replace('/')}
              style={({ pressed }) => cn('py-2 pr-4 flex-row items-center gap-1.5', pressed && 'opacity-70')}
              accessibilityRole="link"
            >
              <ArrowLeft size={20} strokeWidth={2.4} color="#ffffff" />
              <Text style={cn('text-white font-sans font-bold text-lg tracking-tight')}>
                Back to welcome
              </Text>
            </Pressable>
          </View>

          {/* Bottom Form Card */}
          <View
            style={[
              cn('bg-card border-t border-neutral-200/20 px-8 pt-6 pb-8 items-stretch shadow-2xl'),
              {
                borderTopLeftRadius: 40,
                borderTopRightRadius: 40,
                paddingBottom: Math.max(insets.bottom + 16, 28),
              },
            ]}
          >
            {/* Header within Card */}
            <View style={cn('mb-6')}>
              <Text style={cn('text-3xl font-sans font-bold text-foreground tracking-tight')}>
                Create Account
              </Text>
              <Text style={cn('text-sm font-sans text-muted-foreground mt-1')}>
                Create an account to continue to Gnosis
              </Text>
            </View>

            {/* Errors */}
            {(errorMsg || validationErrors.length > 0) && (
              <View style={cn('bg-destructive/10 border border-destructive/20 p-4 rounded-md mb-6')}>
                <Text style={cn('text-destructive font-sans font-bold text-sm mb-1')}>
                  Please check the following:
                </Text>
                {errorMsg && <Text style={cn('text-destructive font-sans text-sm')}>{errorMsg}</Text>}
                {validationErrors.map((err, idx) => (
                  <Text key={idx} style={cn('text-destructive font-sans text-sm')}>
                    • {err}
                  </Text>
                ))}
              </View>
            )}

            {/* Inputs */}
            <View style={cn('gap-5 mb-8')}>
              <View>
                <Text style={cn('text-foreground font-sans font-semibold text-sm mb-2')}>
                  Display Name
                </Text>
                <TextInput
                  style={cn(
                    'w-full bg-muted border font-sans text-foreground px-4 py-3.5 rounded-md text-base',
                    isNameFocused ? 'border-primary bg-background' : 'border-border'
                  )}
                  placeholder="Alice Smith"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="words"
                  autoCorrect={false}
                  value={displayName}
                  onChangeText={setDisplayName}
                  onFocus={() => {
                    setIsNameFocused(true);
                    setIsInputFocused(true);
                  }}
                  onBlur={() => {
                    setIsNameFocused(false);
                    setIsInputFocused(false);
                  }}
                />
              </View>

              <View>
                <Text style={cn('text-foreground font-sans font-semibold text-sm mb-2')}>
                  Email Address
                </Text>
                <TextInput
                  style={cn(
                    'w-full bg-muted border font-sans text-foreground px-4 py-3.5 rounded-md text-base',
                    isEmailFocused ? 'border-primary bg-background' : 'border-border'
                  )}
                  placeholder="you@example.com"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => {
                    setIsEmailFocused(true);
                    setIsInputFocused(true);
                  }}
                  onBlur={() => {
                    setIsEmailFocused(false);
                    setIsInputFocused(false);
                  }}
                />
              </View>

              <View>
                <Text style={cn('text-foreground font-sans font-semibold text-sm mb-2')}>
                  Password
                </Text>
                <View style={cn('relative justify-center')}>
                  <TextInput
                    style={cn(
                      'w-full bg-muted border font-sans text-foreground pl-4 pr-14 py-3.5 rounded-md text-base',
                      isPasswordFocused ? 'border-primary bg-background' : 'border-border'
                    )}
                    placeholder="Min. 8 characters"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => {
                      setIsPasswordFocused(true);
                      setIsInputFocused(true);
                    }}
                    onBlur={() => {
                      setIsPasswordFocused(false);
                      setIsInputFocused(false);
                    }}
                  />
                  <Pressable
                    style={({ pressed }) => cn('absolute right-4 py-2 px-3 justify-center items-center', pressed && 'opacity-70')}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={cn('text-primary font-sans font-semibold text-xs uppercase')}>
                      {showPassword ? 'Hide' : 'Show'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Action Button */}
            <Pressable
              style={({ pressed }) =>
                cn(
                  'w-full bg-primary py-4 rounded-md items-center justify-center shadow-lg shadow-primary/20',
                  (pressed || loading) && 'opacity-90'
                )
              }
              onPress={handleSignUp}
              disabled={loading}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={cn('text-primary-foreground font-sans font-semibold text-base')}>
                  Create Account
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}