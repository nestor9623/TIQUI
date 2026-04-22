import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseClientService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly client: SupabaseClient<any> = createClient(
    environment.supabase.url,
    environment.supabase.anonKey,
  );
}
