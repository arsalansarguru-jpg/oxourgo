import * as React from 'react'
import { Body, Container, Head, Html, Link, Preview, Section, Text } from '@react-email/components'

import { BRAND } from '@/constants/brand'
import { emailTheme } from '@/lib/email/theme'

type OxourEmailLayoutProps = {
  preview: string
  children: React.ReactNode
}

export function OxourEmailLayout({ preview, children }: OxourEmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          margin: 0,
          backgroundColor: emailTheme.pageBg,
          color: emailTheme.soft,
          fontFamily: emailTheme.fontSans,
        }}
      >
        <Section style={{ padding: '32px 16px' }}>
          <Container
            style={{
              maxWidth: '560px',
              margin: '0 auto',
              backgroundColor: emailTheme.cardBg,
              borderRadius: '12px',
              border: `1px solid ${emailTheme.border}`,
              overflow: 'hidden',
            }}
          >
            <Section style={{ padding: '28px 28px 12px' }}>
              <Text
                style={{
                  margin: 0,
                  fontFamily: emailTheme.fontSerif,
                  fontSize: '22px',
                  letterSpacing: '-0.04em',
                  color: emailTheme.soft,
                }}
              >
                {BRAND.name}
              </Text>
              <Text
                style={{
                  margin: '6px 0 0',
                  fontSize: '11px',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: emailTheme.electric,
                }}
              >
                {BRAND.tagline}
              </Text>
            </Section>
            <Section style={{ padding: '8px 28px 32px' }}>{children}</Section>
            <Section
              style={{
                borderTop: `1px solid ${emailTheme.border}`,
                padding: '20px 28px',
                backgroundColor: 'rgba(15, 23, 42, 0.55)',
              }}
            >
              <Text style={{ margin: 0, fontSize: '12px', color: emailTheme.muted, lineHeight: 1.6 }}>
                {BRAND.address}
                <br />
                <Link href={`mailto:${BRAND.email}`} style={{ color: emailTheme.electric }}>
                  {BRAND.email}
                </Link>
              </Text>
            </Section>
          </Container>
        </Section>
      </Body>
    </Html>
  )
}

export function EmailPrimaryButton({ href, label }: { href: string; label: string }) {
  return (
    <Section style={{ textAlign: 'center' as const, margin: '24px 0 8px' }}>
      <Link
        href={href}
        style={{
          display: 'inline-block',
          backgroundColor: emailTheme.electric,
          color: '#0a0f18',
          fontWeight: 600,
          fontSize: '14px',
          padding: '12px 28px',
          borderRadius: '999px',
          textDecoration: 'none',
        }}
      >
        {label}
      </Link>
    </Section>
  )
}

export function EmailMutedRule() {
  return (
    <Section style={{ margin: '20px 0' }}>
      <Text style={{ margin: 0, borderTop: `1px solid ${emailTheme.border}`, height: 1 }} />
    </Section>
  )
}
