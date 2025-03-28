import './App.css';
import { useState, useEffect } from 'react';

function App() {
  const [currentItem, setCurrentItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bannedItems, setBannedItems] = useState([]);
  const [bannedAttributes, setBannedAttributes] = useState({
    breeds: new Set(),
    temperaments: new Set()
  });

  // PURPOSE: displays breed names or temperament traits in clickable way to BAN
  // renders within dog info display
  const AttributePill = ({ attribute, value, onBanAttribute }) => {
    if (!value) return null;
    
    return (
      <span 
        className="attribute-pill"
        onClick={() => onBanAttribute(attribute, value)} //calls ban function when clicked
        title={`Click to ban all ${value} ${attribute}`} //app adds to banned category and fetches new item
      >
        {value}
        <span className="ban-icon"> ×</span>
      </span>
    );
  };

  // PURPOSE: checks if dog matches any banned attributes -> returns true/false to guide fetching
  const isBanned = (dogData) => {
    if (!dogData.breeds?.length) return false;
    
    const breedName = dogData.breeds[0].name.toLowerCase();
    const temperaments = dogData.breeds[0].temperament?.toLowerCase().split(', ') || [];
    
    return (
      bannedAttributes.breeds.has(breedName) ||
      temperaments.some(t => bannedAttributes.temperaments.has(t))
    );
  };

  // PURPOSE: manages API request loop + handles loading and state errors
  const fetchRandomItem = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let attempts = 0;
      const maxAttempts = 5;
      let dogData;

      do {
        const response = await fetch('https://api.thedogapi.com/v1/images/search?limit=1&has_breeds=true',
          {
            headers: {
              'x-api-key': import.meta.env.VITE_API_KEY
            }
          }
        );
        
        [dogData] = await response.json();
        attempts++;

        if (attempts >= maxAttempts) {
          throw new Error('Could not find non-banned dog');
        }

      } while (isBanned(dogData)); //isBanned() filters unwanted dogs

      setCurrentItem({
        imageUrl: dogData.url,
        breeds: dogData.breeds,
        id: dogData.id
      });

    } catch (error) {
      console.error('Error fetching:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const banCurrentItem = () => {
    if (currentItem) {
      setBannedItems([...bannedItems, currentItem.id]);
      fetchRandomItem();
    }
  };

  const handleBanAttribute = (attributeType, attributeValue) => {
    setBannedAttributes(prev => {
      const newBans = new Set(prev[attributeType]);
      newBans.add(attributeValue.toLowerCase());
      return { ...prev, [attributeType]: newBans };
    });
    
    fetchRandomItem();
  };

  // PURPOSE: shows currently banned attributes with option to unban
  const BannedList = ({ bannedAttributes, onUnban }) => (
    <div className="banned-list">
      <h3>banned attributes</h3>
      {[...bannedAttributes.breeds].map(breed => (//displays banned breeds
        <span 
          key={`breed-${breed}`} 
          className="banned-item"
          onClick={() => onUnban('breeds', breed)} //clicking banned breed -> unbans
        >
          {breed} ×
        </span>
      ))}
      {[...bannedAttributes.temperaments].map(temp => (//displays banned temperaments
        <span 
          key={`temp-${temp}`} 
          className="banned-item"
          onClick={() => onUnban('temperaments', temp)} //clicking banned temp -> unbans
        >
          {temp} ×
        </span>
      ))}
    </div>
  );
  
  useEffect(() => {
    fetchRandomItem();
    console.log('API Key:', import.meta.env.VITE_API_KEY); //debugging
    console.log('Base URL:', import.meta.env.VITE_API_BASE_URL); //debugging
  }, []);

  return (
    <div className="app">
      <h1>look at the adorable doggos!!!</h1>
      
      {error ? (
        <div className="error">
          {error} <button onClick={fetchRandomItem}>Try Again</button>
        </div>
      ) : isLoading ? (
        <div className="loading"> FETCHing...</div>
      ) : currentItem ? (
        <div className="random-display">
          <img
            src={currentItem.imageUrl}
            alt="Random Item"
            className="random-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/400x300?text=Dog+Image+Failed+to+Load';
            }}
          />

          {currentItem.breeds?.length > 0 && (
            <div className="random-info">
              <h2>
                <AttributePill
                  attribute="breeds"
                  value={currentItem.breeds[0].name}
                  onBanAttribute={handleBanAttribute}
                />
              </h2>
              <p>
                {currentItem.breeds[0].temperament?.split(', ').map((trait, i) => (
                  <AttributePill
                    key={i}
                    attribute="temperaments"
                    value={trait.trim()}
                    onBanAttribute={handleBanAttribute}
                  />
                ))}
              </p>
            </div>
          )}

          <div className="action-buttons">
            <button onClick={fetchRandomItem} className="nav-button">
              another! teehee
            </button>
            <button onClick={banCurrentItem} className="ban-button">
              im sorry pup... ban them
            </button>
          </div>
        </div>
      ) : (
        <div>No items available</div>
      )}

      <BannedList 
        bannedAttributes={bannedAttributes} 
        onUnban={(type, value) => {
          setBannedAttributes(prev => {
            const newBans = new Set(prev[type]);
            newBans.delete(value);
            return { ...prev, [type]: newBans };
          });
        }}
      />
    </div>
  );
}

export default App;