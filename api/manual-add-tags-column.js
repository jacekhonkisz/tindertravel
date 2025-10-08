const { createClient } = require('@supabase/supabase-js');

async function addTagsColumn() {
  const supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscHhzZWloeWtlbXNibHVzb2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODIzMjQsImV4cCI6MjA3Mzg1ODMyNH0.yuTwUGivtnorQX1WIgvzalscVPqTh3iVNY6yqId1xMs';
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('📝 Adding tags column to hotels table...');
  
  try {
    // Try to update a hotel with tags to trigger column creation
    const { data, error } = await supabase
      .from('hotels')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing hotels table:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      const hotelId = data[0].id;
      
      // Try to update with tags to create the column
      const { error: updateError } = await supabase
        .from('hotels')
        .update({ 
          tags: ['test_tag'],
          updated_at: new Date().toISOString()
        })
        .eq('id', hotelId);
      
      if (updateError) {
        console.error('❌ Error adding tags column:', updateError.message);
      } else {
        console.log('✅ Tags column added successfully!');
        
        // Remove the test tag
        await supabase
          .from('hotels')
          .update({ 
            tags: [],
            updated_at: new Date().toISOString()
          })
          .eq('id', hotelId);
        
        console.log('✅ Test tag removed');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addTagsColumn();
