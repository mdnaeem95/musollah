export const getStatusColor = (status: string) => {
    switch (status) {
        case 'Available': return '#4CAF50'; // green
        case 'Unavailable': return '#F44336'; // red
        default: return '#888'; // gray
    }
}
  
export const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} mins ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hrs ago`;
    return `${Math.floor(diff / 86400000)} days ago`;
}
  