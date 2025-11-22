-- Add company field to profiles table
ALTER TABLE public.profiles ADD COLUMN company TEXT;

-- Update the handle_new_user function to include company from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    user_id, 
    first_name, 
    last_name,
    display_name,
    company
  )
  VALUES (
    gen_random_uuid(),
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    COALESCE(
      new.raw_user_meta_data ->> 'display_name',
      CONCAT(new.raw_user_meta_data ->> 'first_name', ' ', new.raw_user_meta_data ->> 'last_name')
    ),
    new.raw_user_meta_data ->> 'company'
  );
  RETURN new;
END;
$$;