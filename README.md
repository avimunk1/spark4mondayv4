This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


monday boards and kyes
please find all the items that the value in field id "1814231990" in the board 1720560988 == to the value in id "text_mkm142mk" in the board 1720560983
now we need to disply on the screen only records that the value in numeric_mknn4ekf>0

Get wmails flow
1. the goal is to create an arey with list of emails
2. the emails are stord in the bord 1720560983 in the field email_mkm15azq
3. this process starts after the user selected a single item and clicks the "get email" button
Steps:
0. store the value in in field ID 1814231990 of the selected item to be used in the next steps
1. Initialize an Array: Create an array named landersEmails to store the retrieved email addresses.
2. Retrieve Data from the Board: Fetch all items from board ID 1720560983, using pagination with a limit of 500 items per request.
3. Filter Items Based on Matching Criteria: For each item retrieved from board 1720560983, check if:
The value in field ID 1814231990 (from board 1720560988)
Matches the value in field ID text_mkm142mk (from board 1720560983).

4. Store Matching Emails: If a match is found, add the email from field ID email_mkm15azq to landersEmails.
Display the Emails: Present the landersEmails array in the UI.