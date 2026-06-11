import { supabase } from '../lib/supabaseClient';

export async function createIntervenantAccount(payload) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (sessionError || !accessToken) {
    throw new Error('Session admin introuvable. Veuillez vous reconnecter.');
  }

  if (!import.meta.env.VITE_SUPABASE_URL || !(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY)) {
    throw new Error('Configuration Supabase frontend incomplète. Vérifiez VITE_SUPABASE_URL et la clé publique.');
  }

  try {
    const { data, error } = await supabase.functions.invoke('create-intervenant', {
      body: payload,
    });

    if (error) {
      let details = null;
      if (error.context) {
        try {
          details = await error.context.json();
        } catch {
          try {
            details = { error: await error.context.text() };
          } catch {
            details = null;
          }
        }
      }

      console.error('create-intervenant returned an error', {
        functionName: 'create-intervenant',
        payload: { ...payload, password: payload.password ? '[masqué]' : '' },
        error,
        details,
      });

      throw new Error(details?.error || error.message || 'Impossible de créer le compte intervenant.');
    }

    console.info('create-intervenant succeeded', {
      functionName: 'create-intervenant',
      authUserId: data?.authUserId,
      warning: data?.warning,
    });

    return data;
  } catch (error) {
    if (error.message?.startsWith('Impossible de créer') || error.message?.includes('déployée')) {
      throw error;
    }
    console.error('create-intervenant request failed', {
      functionName: 'create-intervenant',
      payload: { ...payload, password: payload.password ? '[masqué]' : '' },
      error,
    });
    throw new Error(`Impossible de joindre la fonction create-intervenant. Vérifiez que l’Edge Function est déployée et que CORS est configuré. Détail: ${error.message}`);
  }
}

export async function createBeneficiaireAccount(payload) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (sessionError || !accessToken) {
    throw new Error('Session admin introuvable. Veuillez vous reconnecter.');
  }

  try {
    const { data, error } = await supabase.functions.invoke('create-beneficiaire', {
      body: payload,
    });

    if (error) {
      let details = null;
      if (error.context) {
        try {
          details = await error.context.json();
        } catch {
          try {
            details = { error: await error.context.text() };
          } catch {
            details = null;
          }
        }
      }
      throw new Error(details?.error || error.message || 'Impossible de créer le compte bénéficiaire.');
    }

    return data;
  } catch (error) {
    if (error.message?.startsWith('Impossible de créer') || error.message === 'Ce compte existe déjà.') {
      throw error;
    }
    throw new Error(`Impossible de joindre la fonction create-beneficiaire. Vérifiez que l’Edge Function est déployée. Détail: ${error.message}`);
  }
}
