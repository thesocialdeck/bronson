import { json, type ActionFunctionArgs } from '@remix-run/node';
import { getFamilyMembers, saveFamilyMembers } from '~/lib/family.server';
import type { FamilyMember } from '~/types';

export async function loader() {
  const members = await getFamilyMembers();
  return json({ members });
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method === 'POST') {
    const body = await request.json();

    // Handle JSON string or direct array
    let members: FamilyMember[];
    if (typeof body.members === 'string') {
      members = JSON.parse(body.members);
    } else {
      members = body.members;
    }

    // Validate
    if (!Array.isArray(members) || members.length === 0) {
      return json({ error: 'Invalid family members' }, { status: 400 });
    }

    await saveFamilyMembers(members);
    return json({ success: true });
  }

  return json({ error: 'Method not allowed' }, { status: 405 });
}
