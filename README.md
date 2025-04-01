# Medical Interpreter Web Application

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app), designed as a medical interpreter platform for facilitating communication between clinicians and patients.

## Key Features

### Core Functionality

- Real-time bidirectional translation between English and Spanish
- Voice recognition and text-to-speech capabilities
- Medical action detection and confirmation system
- Conversation summarization and transcript generation

### User Interfaces

- **Landing Page**: Role selection (Clinician/Patient) with distinct visual themes
- **Conversation Interface**: Split-screen design with clinician (blue) and patient (green) views
- **Summary View**: Auto-generated consultation summary with action items
- **Admin Panel**: System configuration and conversation history management

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Prototype Details

### Conversation Interface

- Dual-channel design with color-coded participant views
- Interactive microphone controls with recording indicators
- Action detection prompts with confirmation workflow
- "Repeat last" functionality for translation playback

### Summary Features

- Key point extraction from conversation transcripts
- Action item tracking (completed/pending/cancelled)
- Export options for transcripts and summaries

### Admin Capabilities

- Conversation history search and review
- System configuration for:
  - Translation services
  - Text-to-speech settings
  - Action detection parameters
- EHR/Lab/Scheduling system integrations

## Technical Implementation

This project uses:

- [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) for font optimization
- Responsive design principles for mobile compatibility
- Accessibility-focused UI components
- Mock API endpoints for demonstration purposes

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Future Enhancements

- Additional language support
- Integration with EHR systems
- Advanced natural language processing for medical terminology
- Multi-platform support (tablet, desktop, kiosk modes)
