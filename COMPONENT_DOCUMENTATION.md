# Component Documentation - SetterAI

## Procedence Feature Integration

### Overview
The procedence feature has been integrated across the application to track lead sources with three categories: 'Outbound', 'Inbound', and 'CTA'. This feature allows users to manually assign and filter leads based on their origin.

## Updated Components

### 1. LeadInfoModal.tsx (/src/components/Chat/LeadInfoModal.tsx)
**Purpose**: Enhanced modal for lead information with procedence selection

**Key Features**:
- Procedence dropdown with options: 'Sin asignar', 'Outbound', 'Inbound', 'CTA'
- Grid layout for Status and Procedence fields side by side
- Handles NULL procedence values from Supabase
- Updates procedence in database on save

**Usage**:
```typescript
<LeadInfoModal
  darkMode={darkMode}
  lead={selectedChat.leadData}
  isOpen={showLeadModal}
  onClose={() => setShowLeadModal(false)}
  onUpdate={(updatedLead) => {
    // Handle lead update with procedence
  }}
/>
```

**Procedence Implementation**:
```typescript
// Procedence selection dropdown
<select
  value={editedLead.procedence || ''}
  onChange={(e) => setEditedLead({ 
    ...editedLead, 
    procedence: e.target.value as 'Outbound' | 'Inbound' | 'CTA' | '' 
  })}
>
  <option value="">Sin asignar</option>
  <option value="Outbound">Outbound</option>
  <option value="Inbound">Inbound</option>
  <option value="CTA">CTA</option>
</select>
```

### 2. LeadModal.tsx (/src/components/Leads/LeadModal.tsx)
**Purpose**: Modal for creating and editing leads with procedence support

**Key Features**:
- Procedence field in form for new lead creation
- Default empty procedence for new leads (not hardcoded)
- Grid layout for Status and Procedence selection
- Proper TypeScript typing for procedence

**Usage**:
```typescript
<LeadModal
  darkMode={darkMode}
  isOpen={showModal}
  editingLead={editingLead}
  onClose={() => setShowModal(false)}
  onSave={editingLead ? handleEditLead : handleAddLead}
/>
```

### 3. ChatHeader.tsx (/src/components/Chat/ChatHeader.tsx)
**Purpose**: Chat header displaying lead info with procedence badges

**Key Features**:
- Procedence badge display next to tags and status
- Conditional styling based on procedence type:
  - Outbound: Blue theme
  - Inbound: Green theme  
  - CTA: Orange theme
- Only displays when procedence is not null

**Procedence Display**:
```typescript
{selectedChat.leadData?.procedence && (
  <span className={`text-xs px-2 py-0.5 rounded-full border ${
    selectedChat.leadData.procedence === 'Outbound' 
      ? darkMode ? 'bg-blue-900/20 border-blue-500/50 text-blue-400' : 'bg-blue-50 border-blue-300 text-blue-700'
      : selectedChat.leadData.procedence === 'Inbound'
      ? darkMode ? 'bg-green-900/20 border-green-500/50 text-green-400' : 'bg-green-50 border-green-300 text-green-700'
      : darkMode ? 'bg-orange-900/20 border-orange-500/50 text-orange-400' : 'bg-orange-50 border-orange-300 text-orange-700'
  }`}>
    {selectedChat.leadData.procedence}
  </span>
)}
```

### 4. LeadsFilters.tsx (/src/components/Leads/LeadsFilters.tsx)
**Purpose**: Filtering component with procedence selection

**Key Features**:
- Procedence dropdown filter alongside status filter
- Options: 'Todas las procedencias', 'Outbound', 'Inbound', 'CTA'
- Active filter indicator shows selected procedence
- Clear filters functionality includes procedence

**Filter Implementation**:
```typescript
const procedences = [
  { value: 'all', label: 'Todas las procedencias' },
  { value: 'Outbound', label: 'Outbound' },
  { value: 'Inbound', label: 'Inbound' },
  { value: 'CTA', label: 'CTA' }
];
```

### 5. LeadsPage.tsx (/src/pages/LeadsPage.tsx)
**Purpose**: Main leads management page with procedence filtering

**Key Features**:
- Procedence state management: `selectedProcedence`
- Filtering logic handles NULL procedence values
- Creates/updates leads with procedence field
- Passes procedence filter to LeadsFilters component

**Filtering Logic**:
```typescript
const filteredLeads = leads.filter(lead => {
  const matchesProcedence = selectedProcedence === 'all' || lead.procedence === selectedProcedence;
  return matchesSearch && matchesTags && matchesStatus && matchesProcedence;
});
```

## TypeScript Type Updates

### Lead Interface
```typescript
export type LeadProcedence = 'Outbound' | 'Inbound' | 'CTA';

export interface Lead {
  // ... existing fields
  procedence?: LeadProcedence;
}
```

### Chat Interface
```typescript
export interface Chat {
  // ... existing fields
  leadData?: {
    procedence?: LeadProcedence;
    [key: string]: any;
  };
}
```

## Database Integration

### Supabase Schema
```sql
-- Procedence column in leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS procedence TEXT 
CHECK (procedence IN ('Outbound', 'Inbound', 'CTA'));
```

### SupabaseService Updates
The procedence field is included in all CRUD operations:
- `createLead()`: Accepts procedence in lead data
- `updateLead()`: Updates procedence field
- `getLeads()`: Retrieves procedence values

## Business Logic

### Default Values
- New leads: `procedence = NULL` (not hardcoded to any value)
- Form defaults: Empty string `''` for unassigned state
- Display: "Sin asignar" for NULL values

### Manual Assignment
- Users must manually assign procedence values
- No automatic assignment based on lead source
- Procedence is independent of lead status

### Filtering
- NULL procedence values are handled properly in filters
- Filter shows all leads when "Todas las procedencias" is selected
- Only leads with matching procedence are shown when specific procedence is selected

## Styling Guidelines

### Procedence Badges
- **Outbound**: Blue color scheme (`bg-blue-50 border-blue-300 text-blue-700`)
- **Inbound**: Green color scheme (`bg-green-50 border-green-300 text-green-700`)
- **CTA**: Orange color scheme (`bg-orange-50 border-orange-300 text-orange-700`)
- **Dark Mode**: 20% opacity backgrounds with 50% opacity borders

### Form Styling
- Consistent with existing form elements
- Grid layout for Status and Procedence (2 columns)
- Proper focus states and transitions
- Dark mode support throughout

## Usage Examples

### Creating Lead with Procedence
```typescript
const leadData = {
  username: 'example_user',
  full_name: 'Example User',
  status: 'Open',
  procedence: 'Outbound', // or null for unassigned
  tags: [],
  notes: ''
};

const newLead = await SupabaseService.createLead(leadData);
```

### Filtering Leads by Procedence
```typescript
const [selectedProcedence, setSelectedProcedence] = useState<string>('all');

const filteredLeads = leads.filter(lead => {
  return selectedProcedence === 'all' || lead.procedence === selectedProcedence;
});
```

### Updating Lead Procedence
```typescript
const updatedLead = await SupabaseService.updateLead(leadId, {
  procedence: 'Inbound'
});
```

## Important Notes

1. **NULL Handling**: Always handle NULL procedence values properly - don't default to any specific value
2. **Manual Assignment**: Procedence should only be assigned manually by users, never automatically
3. **Independence**: Procedence is separate from lead status - they are distinct characteristics
4. **Filtering**: NULL values are excluded when filtering by specific procedence
5. **UI Consistency**: Use consistent styling and terminology across all components