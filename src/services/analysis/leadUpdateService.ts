// Lead update service - handles updating leads based on analysis results

import { supabase } from '../../lib/supabase';

export async function updateLeadFromAnalysis(
  leadId: string,
  enrichedAnalysis: any,
  conversationAnalysis: any,
) {
  if (!leadId || leadId === 'undefined') {
    console.error('Invalid leadId in updateLeadFromAnalysis:', leadId);
    return;
  }

  try {
    console.log(`🔄 Updating lead ${leadId} from analysis...`);

    // Extraer información del análisis
    const leadProfile = conversationAnalysis?.memory?.phase_info || {};

    // Generar tags automáticos basados en el análisis
    const autoTags = [];

    // Función para truncar un tag a máximo 4 palabras
    const truncateTag = (tag: string): string => {
      const words = tag.trim().split(/\s+/);
      if (words.length <= 4) return tag;
      return words.slice(0, 4).join(' ');
    };

    // Tags basados en la fase (ya son de 1 palabra)
    const currentPhase = enrichedAnalysis?.analysis_data?.current_phase || 1;
    if (currentPhase >= 4) autoTags.push('caliente');
    else if (currentPhase >= 2) autoTags.push('tibio');
    else autoTags.push('frío');

    // Tags basados en el negocio (limitar a 4 palabras)
    if (leadProfile.business_type) {
      const businessTag = leadProfile.business_type.toLowerCase();
      autoTags.push(truncateTag(businessTag));
    }

    // Tags basados en urgencia y capacidad (ya son de 1-2 palabras)
    if (enrichedAnalysis.urgency_score >= 7) autoTags.push('urgente');
    if (enrichedAnalysis.capacity_score >= 7) autoTags.push('alta-capacidad');

    // Tags basados en los pain points (ya son de 2 palabras)
    if (leadProfile.pain_points?.length > 0) {
      if (leadProfile.pain_points.some((p: any) => p.toLowerCase().includes('venta'))) {
        autoTags.push('necesita-ventas');
      }
      if (leadProfile.pain_points.some((p: any) => p.toLowerCase().includes('cliente'))) {
        autoTags.push('problemas-clientes');
      }
    }

    // Obtener tags existentes para preferirlos
    const { data: existingTags } = await supabase.rpc('get_all_unique_tags');
    const existingTagsMap = new Map(
      (existingTags || []).map(({ tag }: any) => [tag.toLowerCase(), tag]),
    );

    // Normalizar tags automáticos para usar tags existentes cuando sea posible
    const normalizedAutoTags = autoTags.map(tag => {
      const lowerTag = tag.toLowerCase();
      return existingTagsMap.get(lowerTag) || tag;
    });

    // Actualizar tags en el lead
    const { data: currentLead } = await supabase
      .from('leads')
      .select('tags, notes')
      .eq('id', leadId)
      .single();

    const currentTags = currentLead?.tags || [];
    const newTags = [...new Set([...currentTags, ...normalizedAutoTags])];

    // Generar resumen para las notas
    const summaryParts = [];

    if (leadProfile.business_type) {
      summaryParts.push(`💼 Negocio: ${leadProfile.business_type}`);
    }

    if (leadProfile.pain_points?.length > 0) {
      summaryParts.push(`🎯 Dolores: ${leadProfile.pain_points.slice(0, 2).join(', ')}`);
    }

    if (leadProfile.real_goals?.length > 0) {
      summaryParts.push(`🚀 Objetivos: ${leadProfile.real_goals[0]}`);
    }

    if (leadProfile.commitment_level) {
      summaryParts.push(`📊 Compromiso: ${leadProfile.commitment_level}`);
    }

    const newNotes = summaryParts.join('\n');

    // Actualizar el lead
    const leadUpdates: any = {
      tags: newTags,
      updated_at: new Date().toISOString(),
    };

    // Solo actualizar notas si hay contenido nuevo
    if (newNotes && newNotes !== currentLead?.notes) {
      leadUpdates.notes = newNotes;
    }

    const { error: leadError } = await supabase
      .from('leads')
      .update(leadUpdates)
      .eq('id', leadId);

    if (leadError) {
      console.error('Error updating lead:', leadError);
    } else {
      console.log(`✅ Lead updated with ${newTags.length} tags`);
    }

    // Crear o actualizar lead_insights
    await updateLeadInsights(leadId, leadProfile, enrichedAnalysis, autoTags);
  } catch (error) {
    console.error('Error updating lead from analysis:', error);
  }
}

async function updateLeadInsights(
  leadId: string,
  leadProfile: any,
  enrichedAnalysis: any,
  autoTags: string[],
) {
  const insightsData = {
    lead_id: leadId,
    business_info: {
      type: leadProfile.business_type || null,
      details: leadProfile.business_details || null,
      youtube_status: leadProfile.current_youtube_status || null,
      budget_signals: leadProfile.budget_signals || null,
    },
    pain_points: leadProfile.pain_points || [],
    goals: leadProfile.real_goals || [],
    obstacles: leadProfile.obstacles || [],
    personality_profile: {
      type: leadProfile.personality_type || null,
      commitment: leadProfile.commitment_level || null,
      red_flags: leadProfile.red_flags || [],
    },
    communication_preferences: {
      style: leadProfile.personality_type || 'formal',
    },
    auto_tags: autoTags,
    confidence_score: enrichedAnalysis.capacity_score
      ? Math.round(enrichedAnalysis.capacity_score) / 10
      : 0.5,
    updated_at: new Date().toISOString(),
  };

  // Verificar si ya existe
  const { data: existingInsights } = await supabase
    .from('lead_insights')
    .select('id')
    .eq('lead_id', leadId)
    .single();

  if (!existingInsights) {
    // Crear nuevo
    const { error: insertError } = await supabase.from('lead_insights').insert(insightsData);

    if (insertError) {
      console.error('Error creating lead insights:', insertError);
    } else {
      console.log('✅ Lead insights created');
    }
  } else {
    // Actualizar existente
    const { error: updateError } = await supabase
      .from('lead_insights')
      .update(insightsData)
      .eq('lead_id', leadId);

    if (updateError) {
      console.error('Error updating lead insights:', updateError);
    } else {
      console.log('✅ Lead insights updated');
    }
  }
}