import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Lock, Loader2 } from 'lucide-react';

const PLANS = [
  {
    id: 'evaluation',
    name: 'Evaluation',
    price: 10,
    description: 'Try RiskShield with limited features',
    features: [
      { label: 'Single user (1 seat)', included: true },
      { label: 'Basic Risk Register', included: true },
      { label: 'Risk Matrix', included: true },
      { label: 'Basic Treatment Plans', included: true },
      { label: 'Audit Log', included: false },
      { label: 'AI Agents', included: false },
      { label: 'Email Notifications', included: false },
      { label: 'User Management', included: false },
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 99,
    description: 'Essential risk management',
    features: [
      { label: 'Up to 5 users', included: true },
      { label: 'Basic Risk Register', included: true },
      { label: 'Risk Matrix', included: true },
      { label: 'Treatment Plans', included: true },
      { label: 'Audit Log', included: true },
      { label: 'Email Notifications', included: true },
      { label: 'AI Agents', included: false },
      { label: 'User Management', included: false },
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 299,
    description: 'For growing teams',
    popular: true,
    features: [
      { label: 'Up to 50 users', included: true },
      { label: 'Full Risk Register', included: true },
      { label: 'Risk Matrix', included: true },
      { label: 'Treatment Plans', included: true },
      { label: 'Audit Log', included: true },
      { label: 'Email Notifications', included: true },
      { label: 'AI Agents', included: true },
      { label: 'User Management', included: true },
      { label: 'Advanced Analytics', included: true },
      { label: 'API Access', included: true },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 999,
    description: 'Full-featured platform',
    contactSales: true,
    features: [
      { label: 'Unlimited users', included: true },
      { label: 'All features', included: true },
      { label: 'Custom integrations', included: true },
      { label: 'Dedicated support', included: true },
      { label: 'Advanced compliance', included: true },
      { label: 'White-label options', included: true },
    ],
  },
];

export default function Pricing() {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');
  const params = new URLSearchParams(window.location.search);
  const [success, setSuccess] = useState(params.get('success') === 'true');
  const [activating, setActivating] = useState(success);
  const [activated, setActivated] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!success) return;
    // Poll for active subscription after checkout
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const subs = await base44.entities.Subscription.list('-created_date', 1);
        const active = subs.find(s => s.status === 'active');
        if (active) {
          clearInterval(pollRef.current);
          setActivating(false);
          setActivated(true);
        }
      } catch {}
      if (attempts >= 20) { // stop after ~40s
        clearInterval(pollRef.current);
        setActivating(false);
      }
    }, 2000);
    return () => clearInterval(pollRef.current);
  }, [success]);

  const handleCheckout = async (planId) => {
    if (window.self !== window.top) {
      alert('Checkout is only available from the published app. Please open the app directly.');
      return;
    }
    setLoading(planId);
    setError('');
    try {
      const response = await base44.functions.invoke('createCheckoutSession', { plan: planId });
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        setError('Failed to create checkout session');
      }
    } catch (err) {
      setError('Error initiating checkout. Please try again.');
      console.error('Checkout error:', err);
    } finally {
      setLoading(null);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{activated ? '🎉 You\'re all set!' : 'Payment received'}</CardTitle>
            <CardDescription>
              {activated ? 'Your account is now active' : 'Activating your subscription…'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {activating && (
              <div className="flex items-center justify-center gap-2 py-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Verifying payment with Stripe…</span>
              </div>
            )}
            {activated && (
              <p className="text-sm text-muted-foreground">
                Your subscription is active. All features for your plan are now unlocked.
              </p>
            )}
            {!activating && !activated && (
              <p className="text-sm text-muted-foreground">
                This is taking a little longer than usual. Your access will be granted shortly — check back in a moment.
              </p>
            )}
            <Button
              onClick={() => window.location.href = '/'}
              className="w-full"
              disabled={activating}
            >
              {activating ? 'Please wait…' : 'Go to Dashboard'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Simple, Transparent Pricing</h1>
          <p className="text-lg text-muted-foreground">Choose the perfect plan for your organization</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`flex flex-col ${plan.popular ? 'border-primary shadow-lg ring-2 ring-primary/20' : ''}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription className="mt-1">{plan.description}</CardDescription>
                  </div>
                  {plan.popular && <Badge className="ml-2 shrink-0">Popular</Badge>}
                  {plan.id === 'evaluation' && <Badge variant="outline" className="ml-2 shrink-0 text-xs">Trial</Badge>}
                </div>
                <div className="mt-4">
                  {plan.contactSales ? (
                    <p className="text-3xl font-bold text-foreground">Custom</p>
                  ) : (
                    <p className="text-3xl font-bold text-foreground">
                      ${plan.price}
                      <span className="text-sm font-normal text-muted-foreground">/mo</span>
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex flex-col flex-1 space-y-4">
                <div className="space-y-2 flex-1">
                  {plan.features.map((feature, i) => (
                    <div key={i} className={`flex items-start gap-2 ${!feature.included ? 'opacity-40' : ''}`}>
                      {feature.included ? (
                        <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      )}
                      <span className="text-sm text-foreground">{feature.label}</span>
                    </div>
                  ))}
                </div>

                {plan.contactSales ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.location.href = 'mailto:sales@riskshield.io'}
                  >
                    Contact Sales
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.id === 'evaluation' ? 'outline' : 'default'}
                    onClick={() => handleCheckout(plan.id)}
                    disabled={loading !== null}
                  >
                    {loading === plan.id ? 'Processing...' : plan.id === 'evaluation' ? 'Start Evaluation' : 'Get Started'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Not ready? <span className="text-primary font-semibold">Beta testers get free access</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Apply for the beta program to test RiskShield before committing
          </p>
        </div>
      </div>
    </div>
  );
}