export type Faq = {
  id: string
  question: string
  answer: string
}

export const carDetailFaqs: Faq[] = [
  {
    id: '1',
    question: 'What documents do I need to self-drive?',
    answer:
      'A valid Indian or international driving license, government ID (Aadhaar or passport), and a quick selfie verification. Corporate guests may provide a company letter when applicable.',
  },
  {
    id: '2',
    question: 'Is the security deposit refundable?',
    answer:
      'Yes. The deposit is a pre-authorization hold on your card and is released after return inspection, typically within 5–7 business days depending on your bank.',
  },
  {
    id: '3',
    question: 'Can I extend my booking?',
    answer:
      'Extensions are subject to availability. Use the dashboard extension request or message support on WhatsApp—we prioritize existing guests.',
  },
  {
    id: '4',
    question: 'Are there kilometer limits?',
    answer:
      'Each plan includes a generous daily allowance. Overage is billed transparently per kilometer with no surprise surcharges beyond the stated rate card.',
  },
]

export const supportFaqs: Faq[] = [
  {
    id: 's1',
    question: 'How fast is roadside assistance?',
    answer:
      'Our Mumbai network targets sub-45 minute response for verified breakdowns within city limits, 24x7.',
  },
  {
    id: 's2',
    question: 'Where do I collect the car?',
    answer:
      'All handovers are at our Mira Road hub. Vehicles must be picked up and returned there — we do not offer delivery or airport pickup.',
  },
]
