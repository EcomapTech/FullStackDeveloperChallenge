import React, { useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import "./NavigationMenuOpen.css";
import SearchResults from "./SearchResults";
import ReplaceSection from "./ReplaceSection";
import Confirmation from "./Confirmation";

// NavigationMenuOpen component for displaying search results and actions
const NavigationMenuOpen = ({ onClose }) => {
  // Component state using useState hook
  const [state, setState] = useState({
    query: "",
    results: [],
    resultCount: 0,
    error: "",
    showResultsSection: true,
    newWord: "",
    showReplaceSection: false,
    isReplaceCompleted: false,
    showDeleteConfirmation: false,
    isDeleteCompleted: false,
    hasSearched: false,
  });

  // Function to shuffle an array
  const shuffleArray = (array) => {
    const shuffled = array.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Function to highlight query words in text
  const highlightQueryWord = (text) => {
    const { query } = state;
    const queryParts = query.toLowerCase().split(" ");
    const segments = [];
    let currentIndex = 0;

    while (currentIndex < text.length) {
      const startIdx = text.toLowerCase().indexOf(queryParts[0], currentIndex);
      if (startIdx === -1) {
        segments.push(text.slice(currentIndex));
        break;
      }

      segments.push(text.slice(currentIndex, startIdx));
      currentIndex = startIdx;

      for (const part of queryParts) {
        if (text.toLowerCase().startsWith(part, currentIndex)) {
          segments.push(
            <strong key={currentIndex}>
              {text.slice(currentIndex, currentIndex + part.length)}
            </strong>
          );
          currentIndex += part.length;
        } else {
          segments.push(text[currentIndex]);
          currentIndex += 1;
        }
      }
    }

    return segments;
  };

  // Function to fetch search results from the server
  const fetchSearchResults = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/find_matching_sentences?input=${state.query}`
      );
      const matchingSentences = response.data.matching_sentences;

      const randomized = shuffleArray(matchingSentences);

      // Update component state with results and set the search flag
      setState({
        ...state,
        results: randomized,
        resultCount: randomized.length,
        error: "",
        hasSearched: true,
      });
    } catch (error) {
      // Handle errors and update state with an error message
      setState({
        ...state,
        error: "An error occurred while fetching results.",
        results: [],
        resultCount: 0,
        hasSearched: true,
      });
    }
  };

  // Event handler for Enter key press to initiate search
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fetchSearchResults();
    }
  };

  // Function to handle word replacement
  const handleReplace = async () => {
    try {
      await axios.put("http://localhost:5000/replace_word", {
        old_word: state.query,
        new_word: state.newWord,
      });

      // Update UI or show a success message if needed
      setState({
        ...state,
        results: [],
        error: "",
        isDeleteCompleted: false,
        isReplaceCompleted: true,
        showResultsSection: false,
        showReplaceSection: false,
      });
    } catch (error) {
      // Handle errors and update state with an error message
      setState({
        ...state,
        error: "An error occurred while replacing the word.",
      });
    }
  };

  // Function to handle deletion confirmation
  const handleDelete = async () => {
    setState({
      ...state,
      showDeleteConfirmation: true,
    });
  };

  // Function to confirm and perform deletion
  const confirmDelete = async () => {
    try {
      await axios.delete(
        `http://localhost:5000/remove_similar_word?word=${state.query}`
      );

      // Update state after successful deletion
      setState({
        ...state,
        showDeleteConfirmation: false,
        results: [],
        error: "",
        isDeleteCompleted: true,
      });
    } catch (error) {
      // Handle errors and update state with an error message
      setState({
        ...state,
        error: "An error occurred while deleting results.",
      });
    }
  };

  // JSX for rendering the component
  return (
    <div className="menu menu-open">
      <div className="header" onClick={onClose}>
        <div className="menu-title">Menu</div>
        <div className="close-icon">
          <img src={require("../assets/x.png")} alt="Menu Icon" />
        </div>
      </div>
      <div className="input-section">
        <form>
          <label htmlFor="searchInput" className="searchLabel">
            Search
          </label>
          <input
            type="text"
            id="searchInput"
            className={state.query ? "input-filled" : ""}
            placeholder="Search text"
            value={state.query}
            onChange={(e) => setState({ ...state, query: e.target.value })}
            onKeyDown={handleKeyDown}
            disabled={
              state.showDeleteConfirmation ||
              state.isDeleteCompleted ||
              state.isReplaceCompleted
            }
          />

          {/* Results section */}
          {state.showResultsSection &&
            !state.showDeleteConfirmation &&
            !state.isDeleteCompleted &&
            !state.isReplaceCompleted &&
            !state.showReplaceSection && (
              <SearchResults
                results={state.results}
                resultCount={state.resultCount}
                error={state.error}
                hasSearched={state.hasSearched}
                onReplace={() => {
                  setState({
                    ...state,
                    showReplaceSection: true,
                    showResultsSection: false,
                  });
                }}
                onDelete={handleDelete}
                highlightQueryWord={highlightQueryWord}
              />
            )}

          {/* Display "No results found" only if a search has been attempted */}
          {state.hasSearched &&
            !state.showResultsSection &&
            !state.showDeleteConfirmation &&
            !state.isDeleteCompleted &&
            !state.isReplaceCompleted &&
            !state.showReplaceSection && (
              <p className="noResults">No results found</p>
            )}

          {/* Replace with section */}
          {state.showReplaceSection && (
            <ReplaceSection
              newWord={state.newWord}
              handleReplace={handleReplace}
              handleNewWordChange={(e) =>
                setState({ ...state, newWord: e.target.value })
              }
            />
          )}
          {/* Conditional rendering of the Confirmation component */}
          <Confirmation
            showReplaceSection={state.showReplaceSection}
            isReplaceCompleted={state.isReplaceCompleted}
            showDeleteConfirmation={state.showDeleteConfirmation}
            isDeleteCompleted={state.isDeleteCompleted}
            query={state.query}
            newWord={state.newWord}
            resultCount={state.resultCount}
            confirmDelete={confirmDelete}
          />
        </form>
      </div>
    </div>
  );
};

// he onClose prop must be a required function
NavigationMenuOpen.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default NavigationMenuOpen;
