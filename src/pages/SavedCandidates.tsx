import React, { useState, useEffect } from 'react';
import { Candidate } from '../interfaces/Candidate.interface';

const SavedCandidates: React.FC = () => {
  const [savedCandidates, setSavedCandidates] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [isAscending, setIsAscending] = useState(true);

  const handleRemoveCandidate = (username: string) => {
    const newSavedCandidates = savedCandidates.filter(
      (candidate) => candidate.login !== username
    );
    setSavedCandidates(newSavedCandidates);
    localStorage.setItem('savedCandidates', JSON.stringify(newSavedCandidates));
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setIsAscending(!isAscending);
    } else {
      setSortField(field);
      setIsAscending(true);
    }
  };

  const filteredCandidates = () => {
    let filtered = [...savedCandidates];

    if (searchTerm) {
      const searchTextLower = searchTerm.toLowerCase();
      filtered = filtered.filter((candidate) => {
        return (
          candidate.name?.toLowerCase().includes(searchTextLower) ||
          candidate.login?.toLowerCase().includes(searchTextLower) ||
          candidate.location?.toLowerCase().includes(searchTextLower) ||
          candidate.email?.toLowerCase().includes(searchTextLower) ||
          candidate.company?.toLowerCase().includes(searchTextLower)
        );
      });
    }

    if(sortField){
        filtered.sort((a, b) => {
            const aValue = a[sortField as keyof Candidate];
            const bValue = b[sortField as keyof Candidate];
            if (typeof aValue === 'string' && typeof bValue === 'string') {
              return isAscending ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            } else if (typeof aValue === 'number' && typeof bValue === 'number'){
              return isAscending ? aValue - bValue : bValue - aValue;
            } else {
              return 0
            }
          });
    }
    return filtered
  }

useEffect(() => {
  const storedCandidates = localStorage.getItem('savedCandidates');
  if (storedCandidates) {
    try {
      const parsedCandidates = JSON.parse(storedCandidates) as Candidate[];
      setSavedCandidates(parsedCandidates);
    } catch (error) {
      console.error('Error parsing saved candidates:', error);
      localStorage.removeItem('savedCandidates');
      alert("There was an error loading the saved candidates, local storage may be corrupt and has been cleared.")
    }
  }
}, []);

  const candidatesToDisplay = filteredCandidates();

  if (savedCandidates.length === 0) { // Check if there are no saved candidates
    return (
      <div>
        <h1>Potential Candidates</h1>
        <p>No candidates match the filter criteria.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Potential Candidates</h1>
      
      {/* Conditional rendering to display zero results message */}
      {candidatesToDisplay.length === 0 && <p>No candidates match the filter criteria.</p>}
      <input
        className='search-bar'
        type="text"
        placeholder="Filter candidates..."
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
      />
      
      <table className="table">
      <thead>
          <tr>
            <th>Avatar</th>
            <th onClick={() => handleSort('name')}>
              Name {sortField === 'name' && (isAscending ? '▲' : '▼')}
            </th>
            <th onClick={() => handleSort('login')}>
              Username {sortField === 'login' && (isAscending ? '▲' : '▼')}
            </th>
            <th>Location</th>
            <th onClick={() => handleSort('email')}>
              Email {sortField === 'email' && (isAscending ? '▲' : '▼')}
            </th>
            <th onClick={() => handleSort('html_url')}>
              Github URL {sortField === 'html_url' && (isAscending ? '▲' : '▼')}
            </th>
            <th onClick={() => handleSort('company')}>
              Company {sortField === 'company' && (isAscending ? '▲' : '▼')}
            </th>
            <th>Reject</th>
          </tr>
        </thead>
        <tbody>
          {candidatesToDisplay.map((candidate) => (
            <tr key={candidate.id}>
              <td><img className='table-img' src={candidate.avatar_url} alt={candidate.name}/></td>
              <td>{candidate.name}</td>
              <td>{candidate.login}</td>
              <td>{candidate.location}</td>
              <td><a href={`mailto:${candidate.email}`}>{candidate.email}</a></td>
              <td><a href={candidate.html_url} target='_blank'>{candidate.html_url}</a></td>
              <td>{candidate.company}</td>
              <td><button onClick={() => handleRemoveCandidate(candidate.login)}>-</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SavedCandidates;