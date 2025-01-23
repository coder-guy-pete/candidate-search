import React, { useState, useEffect } from 'react';
import { searchGithub, searchGithubUser } from '../api/API';
import { Candidate } from '../interfaces/Candidate.interface';

const CandidateSearch: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [currentCandidateIndex, setCurrentCandidateIndex] = useState(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCandidates, setSavedCandidates] = useState<Candidate[]>([]);
  const MaxCandidates = 10;

  const fetchCandidates = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch candidates from Github
      const fetchedCandidates: Candidate[] = await searchGithub();

      // Check if fetchedCandidates is an array of candidates
      if (!fetchedCandidates || !Array.isArray(fetchedCandidates)) {
        throw new Error("Invalid response from searchGithub API. Expected an array.");
      }

      fetchedCandidates.filter((candidate): candidate is Candidate => candidate.login !== null && candidate.html_url !== null); // Filter out null logins and html_urls
      const trimmedCandidates = fetchedCandidates.slice(0, MaxCandidates); // Limit the number of candidates to display

      // Fetch detailed information for each candidate
      const detailedCandidates = await Promise.all(
        trimmedCandidates.map(async (candidate: Candidate) => {
          try {
            const detailedCandidate = await searchGithubUser(candidate.login);
            return detailedCandidate;
          } catch (error: any) { // Catch error with type any
            if (error?.response?.status === 404) {
              return null;
            } else {
              console.error(`Error fetching details for ${candidate.login}:`, error);
            }
            return null;
          }
        })
      );

      setCandidates(detailedCandidates.filter((candidate): candidate is Candidate => candidate !== null));
    } catch (error) {
      console.error('Error fetching candidates:', error);
      setError('Failed to load candidates. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCandidate = (candidate: Candidate) => {
    if (candidate) { // Check if candidate is not null
      const newSavedCandidates = [...savedCandidates, candidate];
      setSavedCandidates(newSavedCandidates);
      localStorage.setItem('savedCandidates', JSON.stringify(newSavedCandidates));
      goToNextCandidate();
    }
  };

  const handleRemoveCandidate = () => {
    goToNextCandidate();
  };

  const goToNextCandidate = () => {
    if (currentCandidateIndex < candidates.length - 1) { // Only update index if there are more candidates
      setCurrentCandidateIndex((prevIndex) => prevIndex + 1);
    } else {
      setCandidates([]); // Clear candidates when no more are left
    }
  };

  useEffect(() => {
    const storedCandidates = localStorage.getItem('savedCandidates');
    if (storedCandidates) {
      try {
        const parsedCandidates = JSON.parse(storedCandidates) as Candidate[];
        setSavedCandidates(parsedCandidates);
      } catch (error) {
        console.error('Error parsing saved candidates:', error);
        localStorage.removeItem('savedCandidates');
      }
    }

    fetchCandidates();
  }, []);

  const currentCandidate = candidates.length > 0 ? candidates[currentCandidateIndex] : null;

  return (
    <div className="candidate-search">
      <h1>Candidate Search</h1>
      <div className="candidates">
        {isLoading ? (
          <p>Loading candidate...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : currentCandidate ? (
          <div key={currentCandidate.login} className="candidate-card">
            <img
              src={currentCandidate.avatar_url || 'https://placehold.co/400'}
              alt={currentCandidate.name || 'No image available'} />
            <div className="card-content">
              <h3>{currentCandidate.name}</h3>
              <p>Username: {currentCandidate.login}</p>
              <p>Location: {currentCandidate.location}</p>
              <p>Email: {currentCandidate.email ? <a href={`mailto:${currentCandidate.email}`}>{currentCandidate.email}</a> : 'N/A'}</p>
              <p>github: <a href={currentCandidate.html_url} target='_blank'>{currentCandidate.html_url}</a></p>
              <p>Company: {currentCandidate.company}</p>
            </div>
            <div className="actions">
              <button onClick={handleRemoveCandidate}>-</button>
              <button onClick={() => handleAddCandidate(currentCandidate)}>+</button>
            </div>
          </div>
        ) : candidates.length === 0 ? (
          <p>There are no more candidates available. Please refresh the page to generate a new list of candidates.</p>
        ) : (
          <p>No candidates found.</p>
        )}
      </div>
    </div>
  );
};

export default CandidateSearch;
