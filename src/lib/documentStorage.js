import { supabase } from './supabase';

/**
 * Upload document to Supabase Storage
 * @param {string} projectSlug - Project identifier
 * @param {string} docType - 'brochure' or 'map'
 * @param {File} file - File object to upload
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export const uploadDocument = async (projectSlug, docType, file) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${projectSlug}/${docType}.${fileExt}`;
    const filePath = `project-documents/${fileName}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Replace if exists
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Save metadata to database
    const { error: dbError } = await supabase
      .from('project_documents')
      .upsert({
        project_slug: projectSlug,
        doc_type: docType,
        filename: file.name,
        file_size: file.size,
        file_type: file.type,
        file_url: urlData.publicUrl,
        uploaded_at: new Date().toISOString()
      }, {
        onConflict: 'project_slug,doc_type'
      });

    if (dbError) throw dbError;

    return {
      success: true,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload document'
    };
  }
};

/**
 * Get documents for a project
 * @param {string} projectSlug - Project identifier
 * @returns {Promise<{brochure: object|null, map: object|null}>}
 */
export const getProjectDocuments = async (projectSlug) => {
  try {
    const { data, error } = await supabase
      .from('project_documents')
      .select('*')
      .eq('project_slug', projectSlug);

    if (error) throw error;

    const result = { brochure: null, map: null };
    
    data?.forEach(doc => {
      result[doc.doc_type] = {
        filename: doc.filename,
        size: doc.file_size,
        type: doc.file_type,
        url: doc.file_url,
        uploadedAt: doc.uploaded_at
      };
    });

    return result;
  } catch (error) {
    console.error('Error fetching documents:', error);
    return { brochure: null, map: null };
  }
};

/**
 * Get all project documents
 * @returns {Promise<Object>}
 */
export const getAllProjectDocuments = async () => {
  try {
    const { data, error } = await supabase
      .from('project_documents')
      .select('*');

    if (error) throw error;

    const result = {};
    
    data?.forEach(doc => {
      if (!result[doc.project_slug]) {
        result[doc.project_slug] = { brochure: null, map: null };
      }
      result[doc.project_slug][doc.doc_type] = {
        filename: doc.filename,
        size: doc.file_size,
        type: doc.file_type,
        url: doc.file_url,
        uploadedAt: doc.uploaded_at
      };
    });

    return result;
  } catch (error) {
    console.error('Error fetching all documents:', error);
    return {};
  }
};

/**
 * Delete a document
 * @param {string} projectSlug - Project identifier
 * @param {string} docType - 'brochure' or 'map'
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteDocument = async (projectSlug, docType) => {
  try {
    // Get file path from database
    const { data: docData, error: fetchError } = await supabase
      .from('project_documents')
      .select('file_url')
      .eq('project_slug', projectSlug)
      .eq('doc_type', docType)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    // Delete from storage if exists
    if (docData?.file_url) {
      const filePath = docData.file_url.split('/').slice(-2).join('/');
      await supabase.storage
        .from('documents')
        .remove([`project-documents/${filePath}`]);
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('project_documents')
      .delete()
      .eq('project_slug', projectSlug)
      .eq('doc_type', docType);

    if (deleteError) throw deleteError;

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete document'
    };
  }
};
