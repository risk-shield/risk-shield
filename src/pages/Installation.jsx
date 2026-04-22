import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Terminal } from 'lucide-react';

const DOWNLOAD_LINKS = {
  docker: 'https://github.com/riskshield/riskshield-self-hosted/releases/download/latest/docker-compose.zip',
  guide: 'https://github.com/riskshield/riskshield-self-hosted/raw/main/DEPLOYMENT.md',
  github: 'https://github.com/riskshield/riskshield-self-hosted'
};

const STEPS = [
  {
    number: 1,
    title: 'Install Docker',
    description: 'Download and install Docker for your operating system',
    action: 'https://docs.docker.com/get-docker/',
    platforms: ['Windows', 'macOS', 'Linux']
  },
  {
    number: 2,
    title: 'Download Files',
    description: 'Get the docker-compose configuration and setup files',
    action: DOWNLOAD_LINKS.docker,
    platforms: ['All']
  },
  {
    number: 3,
    title: 'Configure',
    description: 'Edit .env file with your settings and API keys',
    action: null,
    platforms: ['All']
  },
  {
    number: 4,
    title: 'Deploy',
    description: 'Run docker-compose up to start the application',
    action: null,
    platforms: ['All']
  }
];

export default function Installation() {
  const [copied, setCopied] = useState(false);

  const copyCommand = () => {
    navigator.clipboard.writeText('docker-compose up -d');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Self-Hosted Deployment</h1>
          <p className="text-lg text-muted-foreground">
            Deploy RiskShield on your own infrastructure with Docker
          </p>
        </div>

        {/* Quick Start */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              Quick Start
            </CardTitle>
            <CardDescription>Get running in 5 minutes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-foreground/5 rounded-lg p-4 font-mono text-sm">
              <div className="text-muted-foreground mb-2"># Clone and start</div>
              <div className="text-foreground mb-3">git clone https://github.com/riskshield/riskshield-self-hosted.git</div>
              <div className="text-foreground mb-3">cd riskshield-self-hosted</div>
              <div className="text-foreground">docker-compose up -d</div>
              <div className="text-muted-foreground mt-3">→ Access at http://localhost:3000</div>
            </div>
            <Button onClick={copyCommand} className="w-full">
              {copied ? '✓ Copied!' : 'Copy Command'}
            </Button>
          </CardContent>
        </Card>

        {/* Step by Step */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Installation Steps</h2>
          <div className="space-y-4">
            {STEPS.map((step) => (
              <Card key={step.number}>
                <CardContent className="pt-6">
                  <div className="flex gap-6 items-start">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        {step.number}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground mb-1">{step.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{step.description}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex gap-1">
                          {step.platforms.map((platform) => (
                            <Badge key={platform} variant="secondary" className="text-xs">
                              {platform}
                            </Badge>
                          ))}
                        </div>
                        {step.action && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => window.open(step.action, '_blank')}
                          >
                            {step.number === 1 ? 'Get Docker' : 'Download'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* System Requirements */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>System Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-foreground mb-3">Minimum</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 2GB RAM</li>
                  <li>• 1GB disk space</li>
                  <li>• Docker 20.10+</li>
                  <li>• 64-bit processor</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-3">Recommended</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 4GB RAM</li>
                  <li>• 20GB disk space</li>
                  <li>• Docker 24.0+</li>
                  <li>• Multi-core processor</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resources */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5" />
                Documentation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Complete deployment guide with troubleshooting
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open(DOWNLOAD_LINKS.guide, '_blank')}
              >
                Read Guide
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Download className="w-5 h-5" />
                Download Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Get docker-compose and configuration files
              </p>
              <Button 
                className="w-full"
                onClick={() => window.open(DOWNLOAD_LINKS.docker, '_blank')}
              >
                Download ZIP
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Terminal className="w-5 h-5" />
                GitHub Repo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Source code and issue tracking
              </p>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => window.open(DOWNLOAD_LINKS.github, '_blank')}
              >
                View Repository
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>What's Included</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid md:grid-cols-2 gap-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Complete RiskShield application</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Nginx reverse proxy</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>SSL/HTTPS support</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Data persistence</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Automatic backups</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Multi-platform support</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}