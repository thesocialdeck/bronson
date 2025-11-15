import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { useState } from 'react';
import { Header } from '~/components/layout/Header';
import { BottomNav } from '~/components/layout/BottomNav';
import { QuickAddButton } from '~/components/layout/QuickAddButton';
import { ContactCard } from '~/components/people/ContactCard';
import { EmptyContacts, EmptySearchResults } from '~/components/shared/EmptyState';
import { getContacts } from '~/lib/markdown.server';
import { Search } from 'lucide-react';

export async function loader({ request }: LoaderFunctionArgs) {
  const contacts = await getContacts();
  return json({ contacts });
}

export default function PeopleRoute() {
  const { contacts } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = contacts.filter((contact) => {
    const query = searchQuery.toLowerCase();
    return (
      contact.name?.toLowerCase().includes(query) ||
      contact.relation?.toLowerCase().includes(query) ||
      contact.parents?.some((p) => p?.toLowerCase().includes(query)) ||
      contact.notes?.toLowerCase().includes(query)
    );
  });

  // Group by relation
  const grouped = filteredContacts.reduce((acc: Record<string, typeof contacts>, contact) => {
    const key = contact.relation || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(contact);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header title="People" />

      <div className="p-4 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-purple-400"
          />
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-auto pb-20">
        {Object.keys(grouped).length === 0 ? (
          searchQuery ? (
            <EmptySearchResults />
          ) : (
            <EmptyContacts onAdd={() => navigate('/add')} />
          )
        ) : (
          Object.entries(grouped).map(([relation, groupContacts]) => (
            <div key={relation}>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {relation}
              </div>
              <div className="space-y-3">
                {groupContacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    name={contact.name}
                    relation={contact.relation}
                    parents={contact.parents}
                    phone={contact.phone}
                    notes={contact.notes}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <QuickAddButton />
      <BottomNav />
    </div>
  );
}
