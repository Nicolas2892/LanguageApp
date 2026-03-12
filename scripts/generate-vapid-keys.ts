import webpush from 'web-push'

const keys = webpush.generateVAPIDKeys()

console.log('# Add these to your .env.local and Vercel environment variables:\n')
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`)
console.log(`VAPID_EMAIL=mailto:your-email@example.com`)
console.log('\n# Remember to update VAPID_EMAIL with your actual email address.')
