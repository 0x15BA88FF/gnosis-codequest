import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Crown, Zap, Building2, Star } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { usePlans, useCurrentSubscription, useCheckout, useVerifyPayment } from '@/lib/hooks';
import type { SubscriptionPlan } from '@/lib/api-types';

const PLAN_ICONS: Record<string, typeof Star> = {
  free: Zap,
  starter: Crown,
  pro: Star,
  enterprise: Building2,
};

const PLAN_COLORS: Record<string, string> = {
  free: '#6b7280',
  starter: '#e35d1e',
  pro: '#8b5cf6',
  enterprise: '#059669',
};

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();
  const { data: plans = [], isLoading: plansLoading, isError: plansError } = usePlans(token);
  const { data: current } = useCurrentSubscription(token);
  const checkoutMutation = useCheckout(token);
  const verifyMutation = useVerifyPayment(token);

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const currentPlanCode = current?.plan?.code || 'free';

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (plan.code === currentPlanCode) return;

    setSelectedPlan(plan.code);
    setProcessing(true);

    try {
      const result = await checkoutMutation.mutateAsync(plan.code);

      if (result.free) {
        Alert.alert('Success', 'You are now on the Free plan.');
        setSelectedPlan(null);
        setProcessing(false);
        return;
      }

      if (result.authorizationUrl) {
        if (Platform.OS === 'web') {
          const popup = window.open(result.authorizationUrl, '_blank', 'width=500,height=700');
          const poll = setInterval(async () => {
            if (!popup || popup.closed) {
              clearInterval(poll);
              try {
                setProcessing(true);
                await verifyMutation.mutateAsync(result.reference!);
                Alert.alert('Success', 'Your subscription has been activated!');
              } catch (e: any) {
                Alert.alert('Verification Failed', e.message || 'Could not verify payment');
              }
              setProcessing(false);
              setSelectedPlan(null);
            }
          }, 500);
        } else {
          const response = await WebBrowser.openBrowserAsync(result.authorizationUrl);
          if (response.type === 'cancel') {
            setProcessing(false);
            setSelectedPlan(null);
            return;
          }
          const url = response.url || '';
          const match = url.match(/[?&](?:trxref|reference)=([^&]+)/);
          if (match) {
            try {
              await verifyMutation.mutateAsync(match[1]);
              Alert.alert('Success', 'Your subscription has been activated!');
            } catch (e: any) {
              Alert.alert('Verification Failed', e.message || 'Could not verify payment');
            }
          }
          setProcessing(false);
          setSelectedPlan(null);
        }
      }
    } catch (e: unknown) {
      setProcessing(false);
      setSelectedPlan(null);
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to start checkout');
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    if (cents === 0) return 'Free';
    const amount = cents / 100;
    const symbols: Record<string, string> = { NGN: '₦', GHS: 'GH₵', USD: '$', ZAR: 'R', KES: 'KSh' };
    return `${symbols[currency] || currency + ' '}${amount}`;
  };

  const formatLimit = (value: number) => {
    return value === -1 ? 'Unlimited' : value.toString();
  };

  if (plansLoading) {
    return (
      <View style={cn('flex-1 bg-background items-center justify-center')}>
        <ActivityIndicator size="large" color="#e35d1e" />
      </View>
    );
  }

  if (plansError) {
    return (
      <View style={cn('flex-1 bg-background items-center justify-center px-8')}>
        <Text style={cn('text-base font-sans font-semibold text-foreground text-center mb-2')}>
          Unable to load plans
        </Text>
        <Text style={cn('text-sm font-sans text-muted-foreground text-center mb-6')}>
          The subscription service may not be available yet. Please try again later.
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => cn('bg-primary px-6 py-3 rounded-md', pressed && 'opacity-90')}
        >
          <Text style={cn('text-primary-foreground font-sans font-semibold text-sm')}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={cn('flex-1 bg-background')}>
      <View
        style={[
          cn('border-b border-border px-6 py-4 bg-card shadow-sm flex-row items-center gap-3'),
          { paddingTop: insets.top + 8 },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => cn('p-1.5 rounded-md', pressed && 'bg-muted')}
        >
          <ArrowLeft size={22} strokeWidth={2.4} color="#000000" />
        </Pressable>
        <View style={cn('flex-1')}>
          <Text style={cn('text-xl font-sans font-bold text-foreground tracking-tight')}>
            Subscription
          </Text>
          <Text style={cn('text-2xs font-sans text-primary font-semibold uppercase tracking-wider')}>
            Choose Your Plan
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          cn('px-6 py-6 gap-4'),
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {plans.map((plan) => {
          const isCurrent = plan.code === currentPlanCode;
          const Icon = PLAN_ICONS[plan.code] || Star;
          const color = PLAN_COLORS[plan.code] || '#6b7280';
          const isUpgrade = plan.sortOrder > (plans.find(p => p.code === currentPlanCode)?.sortOrder || 0);

          return (
            <View
              key={plan.code}
              style={cn(
                'border rounded-xl p-5',
                isCurrent
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card shadow-sm'
              )}
            >
              <View style={cn('flex-row items-center gap-3 mb-4')}>
                <View
                  style={[cn('w-10 h-10 rounded-lg items-center justify-center'), { backgroundColor: color + '1a' }]}
                >
                  <Icon size={20} strokeWidth={2} color={color} />
                </View>
                <View style={cn('flex-1')}>
                  <View style={cn('flex-row items-center gap-2')}>
                    <Text style={cn('text-base font-sans font-bold text-foreground')}>
                      {plan.name}
                    </Text>
                    {isCurrent && (
                      <View style={cn('bg-primary/10 px-2 py-0.5 rounded-full')}>
                        <Text style={cn('text-3xs font-sans font-bold text-primary')}>
                          CURRENT
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={cn('text-2xs font-sans text-muted-foreground')}>
                    {formatPrice(plan.amountCents, plan.currency)}/mo
                  </Text>
                </View>
              </View>

              <View style={cn('gap-2 mb-4')}>
                <View style={cn('flex-row items-center gap-2')}>
                  <Text style={cn('text-xs font-sans text-muted-foreground')}>
                    {formatLimit(plan.maxOrgs)} organizations
                  </Text>
                  <Text style={cn('text-muted-foreground')}>·</Text>
                  <Text style={cn('text-xs font-sans text-muted-foreground')}>
                    {formatLimit(plan.maxMindsPerOrg)} minds/org
                  </Text>
                </View>
              </View>

              {plan.features.length > 0 && (
                <View style={cn('gap-2 mb-4')}>
                  {plan.features.slice(0, 4).map((feature, idx) => (
                    <View key={idx} style={cn('flex-row items-center gap-2')}>
                      <Check size={14} strokeWidth={2.5} color={color} />
                      <Text style={cn('text-xs font-sans text-foreground/80')}>
                        {feature}
                      </Text>
                    </View>
                  ))}
                  {plan.features.length > 4 && (
                    <Text style={cn('text-xs font-sans text-muted-foreground ml-5')}>
                      +{plan.features.length - 4} more features
                    </Text>
                  )}
                </View>
              )}

              {!isCurrent && plan.code !== 'free' && (
                <Pressable
                  onPress={() => handleSelectPlan(plan)}
                  disabled={processing && selectedPlan === plan.code}
                  style={({ pressed }) =>
                    cn(
                      'w-full py-3 rounded-md items-center justify-center flex-row gap-2',
                      isUpgrade ? 'bg-primary' : 'bg-muted',
                      (pressed || (processing && selectedPlan === plan.code)) && 'opacity-90'
                    )
                  }
                >
                  {processing && selectedPlan === plan.code ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text
                      style={cn(
                        'font-sans font-semibold text-sm',
                        isUpgrade ? 'text-primary-foreground' : 'text-foreground'
                      )}
                    >
                      {isUpgrade ? 'Upgrade' : 'Downgrade'}
                    </Text>
                  )}
                </Pressable>
              )}

              {!isCurrent && plan.code === 'free' && currentPlanCode !== 'free' && (
                <Pressable
                  onPress={() => handleSelectPlan(plan)}
                  disabled={processing && selectedPlan === plan.code}
                  style={({ pressed }) =>
                    cn(
                      'w-full py-3 rounded-md items-center justify-center bg-muted',
                      (pressed || (processing && selectedPlan === plan.code)) && 'opacity-90'
                    )
                  }
                >
                  <Text style={cn('font-sans font-semibold text-sm text-foreground')}>
                    Downgrade to Free
                  </Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
