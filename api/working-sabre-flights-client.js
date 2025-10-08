const axios = require('axios');

class WorkingSabreFlightsClient {
  constructor() {
    this.baseUrl = 'https://api.cert.platform.sabre.com';
    this.accessToken = 'T1RLAQK8L2bM5IvRv9bGxIrT9Lzfb3+QgKo27WdW+E89Ms/2xhD3Y+cXuee8J5gd7L1bmgUgAADglIARfFP73UvCNz+HolrznYonWj/EetVXVfeXFnHs6Zr3XvrdBM/d3QnjvZZ3Mlh/wWn9U1zxoJ3fvExsIjw0Wy1uv+HtYzJrk9aeh1wYVDoSnG3lCsptBSvbfuuhFWc3sHbdClThilgKSYGHaKKdz2sRULFLqiQRXAf8rpVmxmjqyzhwK0lU1KpYkJl+nzZtxxn7uSjTeZIe7kZYT/gYk/esTmtg+1X+I/P9kJ+WoorjdI7YiDcVVUKSeEzIrrgAKJ81yeL0yy4GWZObbSGiVhvyyxyizv2UbAzGWWJ9kH0*';
    
    console.log('🔧 Working Sabre Flights Client Initialized');
    console.log(`📍 Base URL: ${this.baseUrl}`);
    console.log(`🎫 Token: ${this.accessToken.substring(0, 30)}...`);
  }

  async searchFlights(searchParams) {
    console.log('\n✈️ Searching flights with Sabre API...');
    
    try {
      const response = await axios.get(`${this.baseUrl}/v1/shop/flights`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json'
        },
        params: searchParams,
        timeout: 15000
      });

      console.log('✅ Flight search successful!');
      console.log(`📊 Status: ${response.status}`);
      console.log(`📄 Found ${response.data.PricedItineraries?.length || 0} flight options`);
      
      return response.data;
    } catch (error) {
      console.error('❌ Flight search failed:');
      console.error(`📊 Status: ${error.response?.status}`);
      console.error(`📄 Error Data:`, error.response?.data);
      throw error;
    }
  }

  async searchRoundTrip(origin, destination, departureDate, returnDate, passengers = 1) {
    console.log(`\n✈️ Searching round trip: ${origin} → ${destination}`);
    console.log(`📅 Departure: ${departureDate}, Return: ${returnDate}`);
    console.log(`👥 Passengers: ${passengers}`);
    
    const searchParams = {
      origin: origin,
      destination: destination,
      departuredate: departureDate,
      returndate: returnDate,
      passengers: passengers
    };

    return await this.searchFlights(searchParams);
  }

  async searchOneWay(origin, destination, departureDate, passengers = 1) {
    console.log(`\n✈️ Searching one way: ${origin} → ${destination}`);
    console.log(`📅 Departure: ${departureDate}`);
    console.log(`👥 Passengers: ${passengers}`);
    
    const searchParams = {
      origin: origin,
      destination: destination,
      departuredate: departureDate,
      passengers: passengers
    };

    return await this.searchFlights(searchParams);
  }

  parseFlightData(flightData) {
    if (!flightData.PricedItineraries) {
      return [];
    }

    return flightData.PricedItineraries.map((itinerary, index) => {
      const outbound = itinerary.AirItinerary.OriginDestinationOptions.OriginDestinationOption[0];
      const inbound = itinerary.AirItinerary.OriginDestinationOptions.OriginDestinationOption[1];
      const pricing = itinerary.AirItineraryPricingInfo.ItinTotalFare;

      return {
        id: index + 1,
        sequenceNumber: itinerary.SequenceNumber,
        outbound: {
          departure: {
            airport: outbound.FlightSegment[0].DepartureAirport.LocationCode,
            time: outbound.FlightSegment[0].DepartureDateTime,
            timezone: outbound.FlightSegment[0].DepartureTimeZone.GMTOffset
          },
          arrival: {
            airport: outbound.FlightSegment[0].ArrivalAirport.LocationCode,
            time: outbound.FlightSegment[0].ArrivalDateTime,
            timezone: outbound.FlightSegment[0].ArrivalTimeZone.GMTOffset
          },
          airline: outbound.FlightSegment[0].MarketingAirline.Code,
          flightNumber: outbound.FlightSegment[0].FlightNumber,
          aircraft: outbound.FlightSegment[0].Equipment.AirEquipType,
          duration: outbound.FlightSegment[0].ElapsedTime,
          stops: outbound.FlightSegment[0].StopQuantity
        },
        inbound: inbound ? {
          departure: {
            airport: inbound.FlightSegment[0].DepartureAirport.LocationCode,
            time: inbound.FlightSegment[0].DepartureDateTime,
            timezone: inbound.FlightSegment[0].DepartureTimeZone.GMTOffset
          },
          arrival: {
            airport: inbound.FlightSegment[0].ArrivalAirport.LocationCode,
            time: inbound.FlightSegment[0].ArrivalDateTime,
            timezone: inbound.FlightSegment[0].ArrivalTimeZone.GMTOffset
          },
          airline: inbound.FlightSegment[0].MarketingAirline.Code,
          flightNumber: inbound.FlightSegment[0].FlightNumber,
          aircraft: inbound.FlightSegment[0].Equipment.AirEquipType,
          duration: inbound.FlightSegment[0].ElapsedTime,
          stops: inbound.FlightSegment[0].StopQuantity
        } : null,
        pricing: {
          baseFare: pricing.BaseFare.Amount,
          totalFare: pricing.TotalFare.Amount,
          taxes: pricing.Taxes.Tax[0].Amount,
          currency: pricing.TotalFare.CurrencyCode
        },
        ticketInfo: {
          type: itinerary.TicketingInfo.TicketType,
          lastTicketDate: itinerary.AirItineraryPricingInfo.LastTicketDate
        }
      };
    });
  }

  async getFlightInspiration(origin) {
    console.log(`\n✈️ Getting flight inspiration from ${origin}...`);
    
    try {
      const response = await axios.get(`${this.baseUrl}/v1/shop/flights/inspiration`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json'
        },
        params: { origin: origin },
        timeout: 15000
      });

      console.log('✅ Flight inspiration successful!');
      return response.data;
    } catch (error) {
      console.error('❌ Flight inspiration failed:');
      console.error(`📊 Status: ${error.response?.status}`);
      console.error(`📄 Error Data:`, error.response?.data);
      throw error;
    }
  }

  async testConnection() {
    console.log('🚀 Testing Sabre Flights API Connection\n');
    
    try {
      // Test with a simple search
      const result = await this.searchRoundTrip('LAX', 'NYC', '2025-10-15', '2025-10-20', 1);
      
      console.log('✅ Connection test successful!');
      console.log(`📊 Found ${result.PricedItineraries?.length || 0} flight options`);
      
      // Parse and display sample data
      const parsedFlights = this.parseFlightData(result);
      if (parsedFlights.length > 0) {
        console.log('\n📋 Sample Flight Data:');
        console.log(JSON.stringify(parsedFlights[0], null, 2));
      }
      
      return true;
    } catch (error) {
      console.log('❌ Connection test failed');
      console.error('Error:', error.message);
      return false;
    }
  }
}

// Export for use in other modules
module.exports = WorkingSabreFlightsClient;

// Run test if this file is executed directly
if (require.main === module) {
  const client = new WorkingSabreFlightsClient();
  client.testConnection().catch(console.error);
}
