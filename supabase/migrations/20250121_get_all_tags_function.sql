-- Create a function to get all unique tags from the leads table
CREATE OR REPLACE FUNCTION public.get_all_unique_tags()
RETURNS TABLE (
  tag text,
  usage_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    unnest(tags) AS tag,
    COUNT(*) AS usage_count
  FROM leads
  WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
  GROUP BY unnest(tags)
  ORDER BY COUNT(*) DESC, unnest(tags) ASC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_all_unique_tags() TO authenticated;

-- Comment on function
COMMENT ON FUNCTION public.get_all_unique_tags() IS 
'Returns all unique tags from the leads table with their usage counts, ordered by most used first';