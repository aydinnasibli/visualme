import { verifyWebhook } from '@clerk/nextjs/webhooks';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/mongodb';
import { UserModel, UserUsageModel, VisualizationModel } from '@/lib/database/models';

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);
    await connectToDatabase();

    const eventType = evt.type;

    if (eventType === 'user.created') {
      const { id, email_addresses, first_name, last_name, image_url, username } = evt.data;
      const primaryEmail = email_addresses.find(
        (e) => e.id === evt.data.primary_email_address_id
      )?.email_address;

      await UserModel.findOneAndUpdate(
        { clerkId: id },
        {
          $setOnInsert: { clerkId: id },
          $set: {
            email: primaryEmail,
            firstName: first_name ?? undefined,
            lastName: last_name ?? undefined,
            imageUrl: image_url ?? undefined,
            username: username ?? undefined,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    if (eventType === 'user.updated') {
      const { id, email_addresses, first_name, last_name, image_url, username } = evt.data;
      const primaryEmail = email_addresses.find(
        (e) => e.id === evt.data.primary_email_address_id
      )?.email_address;

      await UserModel.findOneAndUpdate(
        { clerkId: id },
        {
          $set: {
            email: primaryEmail,
            firstName: first_name ?? undefined,
            lastName: last_name ?? undefined,
            imageUrl: image_url ?? undefined,
            username: username ?? undefined,
          },
        }
      );
    }

    if (eventType === 'user.deleted') {
      const { id } = evt.data;
      if (!id) return NextResponse.json({ error: 'Missing user id' }, { status: 400 });

      // Delete all user data atomically in parallel
      await Promise.all([
        UserModel.deleteOne({ clerkId: id }),
        UserUsageModel.deleteOne({ userId: id }),
        VisualizationModel.deleteMany({ userId: id }),
      ]);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error('Clerk webhook error:', err);
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 });
  }
}
