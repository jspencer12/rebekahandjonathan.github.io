import React, { useState } from 'react';
import './styles.css';

const RecipeIndex = () => {
  const SYMBOLS = {
    plus: String.fromCharCode(65291),   // ＋
    minus: String.fromCharCode(65293),  // －
    heart: String.fromCharCode(0x2764), // ❤
  };

  const [activeTab, setActiveTab] = useState('Recipes');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [favoritedRecipes, setFavoritedRecipes] = useState(new Set());
  const [mealPlanRecipes, setMealPlanRecipes] = useState(new Set());
  const [showFavorites, setShowFavorites] = useState(false);
  const [showMealPlan, setShowMealPlan] = useState(false);

  // Sample recipe data - you'll replace this with real data
  const recipes = [
    { id: 1, title: 'Chocolate Chip Cookies', tags: ['dessert', 'baking'], image: '/api/placeholder/300/200' },
    { id: 2, title: 'Banana Bread', tags: ['breakfast', 'baking'], image: '/api/placeholder/300/200' },
    { id: 3, title: 'Chicken Curry', tags: ['dinner', 'spicy'], image: '/api/placeholder/300/200' },
    { id: 4, title: 'Caesar Salad', tags: ['lunch', 'healthy'], image: '/api/placeholder/300/200' },
    { id: 5, title: 'Beef Stew', tags: ['dinner', 'comfort'], image: '/api/placeholder/300/200' },
    { id: 6, title: 'Pancakes', tags: ['breakfast', 'sweet'], image: '/api/placeholder/300/200' },
    { id: 7, title: 'Tomato Soup', tags: ['lunch', 'comfort'], image: '/api/placeholder/300/200' },
    { id: 8, title: 'Apple Pie', tags: ['dessert', 'baking'], image: '/api/placeholder/300/200' },
  ];

  // Get tags with counts and sort by count (descending)
  const tagCounts = recipes.reduce((acc, recipe) => {
    recipe.tags.forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {});
  
  const sortedTags = Object.entries(tagCounts)
    .sort(([,a], [,b]) => b - a)
    .map(([tag]) => tag);

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => recipe.tags.includes(tag));
    const matchesFavorites = !showFavorites || favoritedRecipes.has(recipe.id);
    const matchesMealPlan = !showMealPlan || mealPlanRecipes.has(recipe.id);
    return matchesSearch && matchesTags && matchesFavorites && matchesMealPlan;
  });

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const toggleFavorite = (recipeId) => {
    setFavoritedRecipes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recipeId)) {
        newSet.delete(recipeId);
      } else {
        newSet.add(recipeId);
      }
      return newSet;
    });
  };

  const toggleMealPlan = (recipeId) => {
    setMealPlanRecipes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recipeId)) {
        newSet.delete(recipeId);
      } else {
        newSet.add(recipeId);
      }
      return newSet;
    });
  };

  const clearMealPlan = () => {
    setMealPlanRecipes(new Set());
    setShowMealPlan(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const navigationTabs = ['Recipes', 'Meal Plan', 'Grocery List'];

  return (
    <div className="app-container">
      <div className="main-frame">
        
        {/* Desktop Header */}
        <div className="desktop-header">
          {navigationTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`nav-button ${activeTab === tab ? 'active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Mobile Header */}
        <div className="mobile-header">
          <button onClick={toggleMobileMenu} className="mobile-menu-button">
            {mobileMenuOpen ? SYMBOLS.minus : SYMBOLS.plus}
          </button>
          <h1 className="mobile-title">{activeTab}</h1>
          <div className="mobile-spacer"></div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="mobile-dropdown">
            {navigationTabs.map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setMobileMenuOpen(false);
                }}
                className={`mobile-nav-button ${activeTab === tab ? 'active' : ''}`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* Main Content - Recipes Page */}
        {activeTab === 'Recipes' && (
          <div className="recipes-content">
            {/* Search and Filter Bar */}
            <div className="search-filter-container">
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              
              <div className="filter-container">
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className={`filter-button ${filterOpen ? 'open' : ''}`}
                >
                  Filter <span className="hide-on-mobile">by tag {filterOpen ? SYMBOLS.minus : SYMBOLS.plus}</span>
                  {selectedTags.length > 0 && (
                    <span className="filter-count-badge">
                      {selectedTags.length}
                    </span>
                  )}
                </button>

                {filterOpen && (
                  <div className="filter-dropdown">
                    <div className="filter-dropdown-title">
                      Tags to include:
                    </div>
                    <div className="filter-tags-container">
                      {sortedTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`filter-tag-button ${selectedTags.includes(tag) ? 'selected' : ''}`}
                        >
                          <span>{tag}</span>
                          <span className="tag-count">
                            {tagCounts[tag]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Filter Action Buttons */}
            <div className="action-buttons-container">
              <button
                onClick={() => setShowFavorites(!showFavorites)}
                className={`action-button favorites-button ${showFavorites ? 'active' : ''}`}
              >
                Show <span className="hide-on-mobile">favorited recipes </span><span className="heart-icon">{SYMBOLS.heart}</span>
                {favoritedRecipes.size > 0 && (
                  <span className="action-count-badge favorites-badge">
                    {favoritedRecipes.size}
                  </span>
                )}
              </button>

              <button
                onClick={() => setShowMealPlan(!showMealPlan)}
                className={`action-button meal-plan-button ${showMealPlan ? 'active' : ''}`}
              >
                Show <span className="hide-on-mobile">Meal Plan selections </span><span className="plus-icon">{SYMBOLS.plus}</span>
                {mealPlanRecipes.size > 0 && (
                  <span className="action-count-badge meal-plan-badge">
                    {mealPlanRecipes.size}
                  </span>
                )}
              </button>

              <button
                onClick={clearMealPlan}
                disabled={mealPlanRecipes.size === 0}
                className="action-button clear-button hide-on-mobile"
              >
                Clear Meal Plan selections
              </button>
            </div>

            {/* Recipe Cards Grid */}
            <div className="recipe-grid">
              {filteredRecipes.map(recipe => (
                <div key={recipe.id} className="recipe-card">
                  <div className="recipe-image">
                    Recipe Image
                    
                    {/* Heart and Plus Icons */}
                    <div className="recipe-icons">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(recipe.id);
                        }}
                        className={`recipe-icon heart-icon ${favoritedRecipes.has(recipe.id) ? 'active' : ''}`}
                      >
                      {SYMBOLS.heart}
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMealPlan(recipe.id);
                        }}
                        className={`recipe-icon plus-icon ${mealPlanRecipes.has(recipe.id) ? 'active' : ''}`}
                      >
                      {SYMBOLS.plus}
                      </button>
                    </div>
                  </div>
                  <div className="recipe-info">
                    <h3 className="recipe-title">
                      {recipe.title}
                    </h3>
                    <div className="recipe-tags">
                      {recipe.tags.map(tag => (
                        <span key={tag} className="recipe-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Placeholder for other pages */}
        {activeTab === 'Meal Plan' && (
          <div className="placeholder-content">
            <h2>Meal Plan page coming soon...</h2>
          </div>
        )}

        {activeTab === 'Grocery List' && (
          <div className="placeholder-content">
            <h2>Grocery List page coming soon...</h2>
          </div>
        )}

      </div>
    </div>
  );
};

export default RecipeIndex;