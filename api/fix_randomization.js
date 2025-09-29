const fs = require('fs');

// Read the unified-server.js file
let content = fs.readFileSync('unified-server.js', 'utf8');

// Replace the old query with randomized version
const oldQuery = `    // Get hotels from Supabase
    const { data: supabaseHotels, error, count } = await supabase
      .from('hotels')
      .select('*', { count: 'exact' })
      .range(offsetNum, offsetNum + limitNum - 1)
      .order('created_at', { ascending: false });`;

const newQuery = `    // Get all hotels from Supabase first, then randomize and paginate
    const { data: supabaseHotels, error, count } = await supabase
      .from('hotels')
      .select('*', { count: 'exact' });`;

// Replace the old query
content = content.replace(oldQuery, newQuery);

// Add randomization logic after the error check
const oldErrorCheck = `    if (!supabaseHotels || supabaseHotels.length === 0) {
      return res.json({
        hotels: [],
        total: count || 0,
        hasMore: false,
        message: count === 0 ? 'No hotels found in database' : 'No more hotels available'
      });
    }`;

const newErrorCheck = `    if (!supabaseHotels || supabaseHotels.length === 0) {
      return res.json({
        hotels: [],
        total: count || 0,
        hasMore: false,
        message: count === 0 ? 'No hotels found in database' : 'No more hotels available'
      });
    }

    // Randomize the hotels array
    const shuffledHotels = supabaseHotels.sort(() => Math.random() - 0.5);
    
    // Apply pagination after randomization
    const paginatedHotels = shuffledHotels.slice(offsetNum, offsetNum + limitNum);`;

content = content.replace(oldErrorCheck, newErrorCheck);

// Update the hotels mapping to use paginatedHotels instead of supabaseHotels
content = content.replace('supabaseHotels.map(hotel => {', 'paginatedHotels.map(hotel => {');

// Write the updated content back
fs.writeFileSync('unified-server.js', content);

console.log('✅ Successfully updated unified-server.js with randomization!');
