-- Enable the trigger for new user creation if not already done
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    first_name, 
    last_name,
    email,
    phone,
    position,
    address,
    city,
    birth_date,
    nationality,
    gender
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email,
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'position',
    NEW.raw_user_meta_data ->> 'address',
    NEW.raw_user_meta_data ->> 'city',
    (NEW.raw_user_meta_data ->> 'birth_date')::DATE,
    NEW.raw_user_meta_data ->> 'nationality',
    NEW.raw_user_meta_data ->> 'gender'
  );
  RETURN NEW;
END;
$$;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();