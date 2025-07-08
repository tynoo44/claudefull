-- Add foreign key constraints for data integrity between leads, conversations, and messages

-- Add foreign key constraint from conversations to leads
ALTER TABLE public.conversations 
ADD CONSTRAINT fk_lead 
FOREIGN KEY (lead_id) 
REFERENCES public.leads(id) 
ON DELETE CASCADE;

-- Add foreign key constraint from messages to conversations
ALTER TABLE public.messages
ADD CONSTRAINT fk_conversation
FOREIGN KEY (conversation_id)
REFERENCES public.conversations(id)
ON DELETE CASCADE;
