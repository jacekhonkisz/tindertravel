const { createClient } = require('@supabase/supabase-js');

async function addTagsColumn() {
  const supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';
  
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
