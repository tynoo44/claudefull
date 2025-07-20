-- Migration: Drop conflicting RPC function
-- Date: 2025-07-20
-- Purpose: Remove the RPC function to resolve overloading error.

DROP FUNCTION IF EXISTS get_conversations_with_last_message();