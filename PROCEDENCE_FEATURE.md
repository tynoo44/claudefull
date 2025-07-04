# Procedence Feature - Complete Implementation Guide

## Feature Overview

The procedence feature allows tracking the source of leads with three predefined categories:
- **Outbound**: Leads generated through outbound marketing efforts
- **Inbound**: Leads that came to the business naturally
- **CTA**: Leads generated through Call-to-Action campaigns

## Implementation Details

### Database Schema
```sql
-- Column added to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS procedence TEXT 
CHECK (procedence IN ('Outbound', 'Inbound', 'CTA'));
```

### TypeScript Types
```typescript
// New type definition
export type LeadProcedence = 'Outbound' | 'Inbound' | 'CTA';

// Updated Lead interface
export interface Lead {
  // ... existing fields
  procedence?: LeadProcedence; // Optional/nullable field
}
```

## User Interface Integration

### 1. Chat Interface (ChatHeader.tsx)
- **Location**: Next to tags and status badges
- **Display**: Colored badge showing procedence value
- **Behavior**: Only shown when procedence is not NULL
- **Styling**: 
  - Outbound: Blue theme
  - Inbound: Green theme
  - CTA: Orange theme

### 2. Lead Management (LeadsPage.tsx)
- **Filter**: Dropdown to filter leads by procedence
- **Options**: "Todas las procedencias", "Outbound", "Inbound", "CTA"
- **Logic**: Handles NULL values properly in filtering

### 3. Lead Modals (LeadModal.tsx & LeadInfoModal.tsx)
- **Form Field**: Dropdown for procedence selection
- **Default**: "Sin asignar" for NULL/empty values
- **Layout**: Grid layout with Status and Procedence side by side
- **Validation**: No validation required (optional field)

## Business Rules

### Assignment Policy
- ✅ **Manual Assignment Only**: Users must manually set procedence values
- ❌ **No Automatic Assignment**: System never assigns procedence automatically
- ✅ **NULL by Default**: New leads have NULL procedence until manually assigned
- ✅ **Independent of Status**: Procedence and lead status are separate characteristics

### Data Handling
- **New Leads**: Created with `procedence: null`
- **Form Defaults**: Empty string `''` represents unassigned state
- **Database Storage**: NULL values stored as NULL (not empty strings)
- **Display Logic**: NULL values show as "Sin asignar"

## Filtering Logic

### Implementation
```typescript
const filteredLeads = leads.filter(lead => {
  const matchesProcedence = selectedProcedence === 'all' || lead.procedence === selectedProcedence;
  return matchesProcedence && /* other filters */;
});
```

### Behavior
- **"Todas las procedencias"**: Shows all leads regardless of procedence value
- **Specific Procedence**: Shows only leads with exact procedence match
- **NULL Handling**: NULL values are excluded when filtering by specific procedence

## Component Architecture

### Modified Components
1. **ChatHeader.tsx** - Display procedence badges
2. **LeadInfoModal.tsx** - Edit procedence in lead profile
3. **LeadModal.tsx** - Set procedence when creating/editing leads
4. **LeadsFilters.tsx** - Filter leads by procedence
5. **LeadsPage.tsx** - State management for procedence filtering

### State Management
```typescript
// Page-level state
const [selectedProcedence, setSelectedProcedence] = useState<string>('all');

// Form state
const [formData, setFormData] = useState({
  procedence: '' // Empty string for new leads
});

// Modal state
const [editedLead, setEditedLead] = useState<Lead>({
  procedence: lead.procedence || '' // Handle NULL values
});
```

## API Integration

### Supabase Service Updates
All CRUD operations handle procedence field:

```typescript
// Create lead
const leadData = {
  username: 'example',
  status: 'Open',
  procedence: formData.procedence || null // Convert empty string to NULL
};

// Update lead
await SupabaseService.updateLead(leadId, {
  procedence: newProcedence || null
});
```

## Styling Guidelines

### Badge Styling
```css
/* Outbound - Blue */
.procedence-outbound {
  @apply bg-blue-50 border-blue-300 text-blue-700;
}
.dark .procedence-outbound {
  @apply bg-blue-900/20 border-blue-500/50 text-blue-400;
}

/* Inbound - Green */
.procedence-inbound {
  @apply bg-green-50 border-green-300 text-green-700;
}
.dark .procedence-inbound {
  @apply bg-green-900/20 border-green-500/50 text-green-400;
}

/* CTA - Orange */
.procedence-cta {
  @apply bg-orange-50 border-orange-300 text-orange-700;
}
.dark .procedence-cta {
  @apply bg-orange-900/20 border-orange-500/50 text-orange-400;
}
```

### Form Styling
- Consistent with existing form elements
- Grid layout for Status/Procedence (2 columns)
- Proper focus states and transitions
- Dark mode support

## User Experience Flow

### Creating New Lead
1. User opens "Nuevo Lead" modal
2. Fills required fields (username, etc.)
3. Optionally selects procedence (defaults to "Sin asignar")
4. Saves lead with NULL procedence if not selected

### Assigning Procedence
1. User opens lead profile (chat header or leads page)
2. Selects procedence from dropdown
3. Saves changes to update database
4. UI immediately reflects new procedence value

### Filtering by Procedence
1. User opens filters panel on leads page
2. Selects specific procedence from dropdown
3. Lead list updates to show only matching leads
4. Filter indicators show active procedence filter

## Testing Considerations

### Test Cases
1. **Create lead without procedence** - Should save as NULL
2. **Create lead with procedence** - Should save selected value
3. **Update procedence to different value** - Should update correctly
4. **Update procedence to "Sin asignar"** - Should set to NULL
5. **Filter by "Todas las procedencias"** - Should show all leads
6. **Filter by specific procedence** - Should show only matching leads
7. **Filter with NULL procedence leads** - Should handle correctly

### Edge Cases
- Lead with NULL procedence in database
- Empty string vs NULL handling
- Form submission with empty procedence
- Filter behavior with mixed NULL/non-NULL values

## Migration Notes

### Database Migration
```sql
-- Safe migration - adds column if not exists
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS procedence TEXT 
CHECK (procedence IN ('Outbound', 'Inbound', 'CTA'));

-- All existing leads will have NULL procedence
-- This is the intended behavior - no default assignment
```

### Code Migration
- No breaking changes to existing functionality
- All procedence-related code handles NULL values properly
- Backward compatible with existing lead data

## Future Enhancements

### Potential Improvements
1. **Procedence Analytics** - Track conversion rates by procedence
2. **Custom Procedence Types** - Allow user-defined procedence categories
3. **Automatic Assignment Rules** - Optional rules for auto-assigning procedence
4. **Procedence History** - Track when procedence was assigned/changed
5. **Bulk Procedence Assignment** - Assign procedence to multiple leads at once

### Integration Opportunities
- Integration with marketing automation tools
- UTM parameter tracking for automatic procedence assignment
- CRM integration for procedence data sync
- Reporting and analytics based on procedence data

## Troubleshooting

### Common Issues
1. **Leads showing wrong procedence** - Check for hardcoded defaults
2. **Filter not working** - Verify NULL handling in filter logic
3. **Procedence not saving** - Check form validation and API calls
4. **UI not updating** - Verify state management and re-rendering

### Debug Tips
- Check database for NULL vs empty string values
- Verify TypeScript types match actual data
- Test filter logic with mixed NULL/non-NULL data
- Ensure form resets properly after submission

## Conclusion

The procedence feature provides a clean, user-controlled way to track lead sources. The implementation respects user workflow by requiring manual assignment while providing convenient filtering and display options. The feature is fully integrated across the application while maintaining backward compatibility and proper NULL value handling.