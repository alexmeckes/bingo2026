import { useState } from 'react';
import './ShareLink.css';

interface Props {
  slug: string;
}

export default function ShareLink({ slug }: Props) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/card/${slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="share-link">
      <button onClick={handleCopy} className="share-btn">
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
    </div>
  );
}
