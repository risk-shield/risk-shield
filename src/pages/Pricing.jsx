import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

const PLANS = [
  {
    name: 'Basic',
    price: 99,
    description: 'Essential risk management',
    features: ['Up to 5 users', 'Basic risk register', 'Risk matrix', 'Email notifications', 'Audit log']
  },
  {
    name: 'Professional',
    price: 299,
    description: 'For growing teams',
    features: ['Up to 50 users', 'Advanced analytics', 'Treatment plans', 'Slack integration', 'Custom reports', 'API access'],
    popular: true
  },
  {
    name: 'Enterprise',
    price: 999,
    description: 'Full-featured platform',
    features: ['Unlimited users', 'All features', 'Custom integrations', 'Dedicated support', 'Advanced compliance', 'White-label options'],
    contactSales: true
  }
];

export default function Pricing() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleCheckout = async (plan) => {
    setLoading(true);
    setError('');

    try {
      const response = await base44.functions.invoke('createCheckoutSession', { plan: plan.toLowerCase() });
      
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        setError('Failed to create checkout session');
      }
    } catch (err) {
      setError('Error initiating checkout. Please try again.');
      console.error('Checkout error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">🎉 Welcome!</CardTitle>
            <CardDescription>Your subscription is being set up</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Please allow a few moments for your account to be activated. You'll be able to access all features shortly.
            </p>
            <Button onClick={() => window.location.href = '/'} className="w-full">
              Return to Dashboard
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

        <div className="grid md:grid-cols-3 gap-8">
          {PLANS.map((plan, idx) => (
            <Card 
              key={idx} 
              className={plan.popular ? 'border-primary shadow-lg scale-105' : ''}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </div>
                  {plan.popular && <Badge>Popular</Badge>}
                </div>
                <div className="mt-4">
                  {plan.contactSales ? (
                    <p className="text-3xl font-bold text-foreground">Custom</p>
                  ) : (
                    <p className="text-3xl font-bold text-foreground">${plan.price}<span className="text-sm text-muted-foreground">/mo</span></p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground">{feature}</span>
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
                    onClick={() => handleCheckout(plan.name)}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Get Started'}
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