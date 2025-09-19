# Clerk Configuration Guide

## Environment Variables Setup

Add these to your `.env.local` file:

```env
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here

# Custom Routes (Important!)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL=/

# MongoDB
MONGODB_URI=your_mongodb_connection_string_here
```

## Clerk Dashboard Configuration

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Configure** → **Paths**
3. Set the following paths:
   - **Sign-in URL**: `/sign-in`
   - **Sign-up URL**: `/sign-up`
   - **After sign-in URL**: `/dashboard`
   - **After sign-up URL**: `/dashboard`
   - **After sign-out URL**: `/`

## Important Notes

- The `NEXT_PUBLIC_CLERK_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL` environment variables are crucial for using custom routes instead of Clerk's hosted pages
- Make sure these match exactly with your route structure
- Restart your development server after updating environment variables

## Troubleshooting

If you're still seeing the default Clerk hosted pages:
1. Check that all environment variables are set correctly
2. Restart your development server
3. Clear your browser cache
4. Verify the Clerk Dashboard configuration matches your environment variables
