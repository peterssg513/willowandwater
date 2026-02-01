import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, ArrowRight, Tag, Share2, Facebook, Twitter, Linkedin, ChevronRight, Sparkles, Calculator, CheckCircle } from 'lucide-react';
import Navbar from './Navbar';
import BookingFlow from './booking/BookingFlow';
import { getPostBySlug, getRelatedPosts, getAllCategories } from '../data/blogPosts';

// Simple markdown-like content renderer
const ContentRenderer = ({ content }) => {
  // Split content into sections
  const lines = content.trim().split('\n');
  const elements = [];
  let currentList = [];
  let currentListType = null;
  let listKey = 0;
  
  const flushList = () => {
    if (currentList.length > 0) {
      if (currentListType === 'ul') {
        elements.push(
          <ul key={`list-${listKey++}`} className="list-disc list-inside space-y-2 mb-6 text-charcoal/70 font-inter">
            {currentList.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        );
      } else if (currentListType === 'ol') {
        elements.push(
          <ol key={`list-${listKey++}`} className="list-decimal list-inside space-y-2 mb-6 text-charcoal/70 font-inter">
            {currentList.map((item, i) => <li key={i}>{item}</li>)}
          </ol>
        );
      } else if (currentListType === 'checklist') {
        elements.push(
          <ul key={`list-${listKey++}`} className="space-y-2 mb-6 text-charcoal/70 font-inter">
            {currentList.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 border border-charcoal/20 rounded flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        );
      }
      currentList = [];
      currentListType = null;
    }
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) {
      flushList();
      return;
    }
    
    // Headings
    if (trimmedLine.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={index} className="text-3xl sm:text-4xl font-playfair font-semibold text-charcoal mb-6 mt-8 first:mt-0">
          {trimmedLine.substring(2)}
        </h1>
      );
      return;
    }
    
    if (trimmedLine.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={index} className="text-2xl font-playfair font-semibold text-charcoal mb-4 mt-8">
          {trimmedLine.substring(3)}
        </h2>
      );
      return;
    }
    
    if (trimmedLine.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={index} className="text-xl font-playfair font-semibold text-charcoal mb-3 mt-6">
          {trimmedLine.substring(4)}
        </h3>
      );
      return;
    }

    // Horizontal rule
    if (trimmedLine === '---') {
      flushList();
      elements.push(<hr key={index} className="my-8 border-charcoal/10" />);
      return;
    }

    // Checklist items
    if (trimmedLine.startsWith('- [ ] ')) {
      if (currentListType !== 'checklist') {
        flushList();
        currentListType = 'checklist';
      }
      currentList.push(trimmedLine.substring(6));
      return;
    }

    // Unordered list
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      if (currentListType !== 'ul') {
        flushList();
        currentListType = 'ul';
      }
      currentList.push(trimmedLine.substring(2));
      return;
    }

    // Ordered list
    if (/^\d+\.\s/.test(trimmedLine)) {
      if (currentListType !== 'ol') {
        flushList();
        currentListType = 'ol';
      }
      currentList.push(trimmedLine.replace(/^\d+\.\s/, ''));
      return;
    }

    // Tables (simple rendering)
    if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
      flushList();
      // Skip separator rows
      if (trimmedLine.includes('---')) return;
      
      const cells = trimmedLine.split('|').filter(cell => cell.trim());
      const isHeader = index > 0 && lines[index + 1]?.includes('---');
      
      if (isHeader || (elements.length > 0 && elements[elements.length - 1]?.type === 'table')) {
        // Add to existing table or create new
      } else {
        elements.push(
          <div key={index} className="overflow-x-auto mb-6">
            <table className="min-w-full border-collapse">
              <tbody>
                <tr className="border-b border-charcoal/10">
                  {cells.map((cell, i) => (
                    <td key={i} className="px-4 py-2 text-sm text-charcoal/70 font-inter">
                      {cell.trim()}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        );
      }
      return;
    }

    // Blockquote
    if (trimmedLine.startsWith('>')) {
      flushList();
      elements.push(
        <blockquote key={index} className="border-l-4 border-sage pl-4 py-2 my-6 italic text-charcoal/70 font-inter">
          {trimmedLine.substring(1).trim()}
        </blockquote>
      );
      return;
    }

    // Emphasis/italics
    if (trimmedLine.startsWith('*') && trimmedLine.endsWith('*') && !trimmedLine.startsWith('**')) {
      flushList();
      elements.push(
        <p key={index} className="text-charcoal/70 font-inter italic mb-4">
          {trimmedLine.slice(1, -1)}
        </p>
      );
      return;
    }

    // Regular paragraph
    flushList();
    
    // Process inline formatting
    let processed = trimmedLine
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-charcoal/5 px-1.5 py-0.5 rounded text-sm">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-sage hover:underline">$1</a>');
    
    elements.push(
      <p 
        key={index} 
        className="text-charcoal/70 font-inter leading-relaxed mb-4"
        dangerouslySetInnerHTML={{ __html: processed }}
      />
    );
  });

  flushList();
  return <>{elements}</>;
};

// In-Article CTA Component
const ArticleCTA = ({ onBookClick }) => (
  <div className="my-10 bg-gradient-to-br from-sage/10 to-sage/5 rounded-2xl border border-sage/20 p-6 sm:p-8">
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="w-16 h-16 bg-sage rounded-2xl flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      <div className="flex-1 text-center sm:text-left">
        <h3 className="font-playfair text-xl font-semibold text-charcoal mb-2">
          Ready for a Cleaner, Healthier Home?
        </h3>
        <p className="text-charcoal/70 font-inter text-sm mb-4">
          Get an instant quote for organic cleaning. No chemicals, just a sparkling clean home that's safe for your family and pets.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
          <button
            onClick={onBookClick}
            className="inline-flex items-center justify-center gap-2 bg-sage text-white px-6 py-3 rounded-xl font-inter font-medium hover:bg-sage/90 transition-colors"
          >
            <Calculator className="w-5 h-5" />
            Get Your Price
          </button>
          <div className="flex items-center justify-center gap-2 text-sm text-charcoal/60 font-inter">
            <CheckCircle className="w-4 h-4 text-sage" />
            Free quotes, no commitment
          </div>
        </div>
      </div>
    </div>
  </div>
);

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const post = getPostBySlug(slug);
  const relatedPosts = getRelatedPosts(slug, 3);
  const categories = getAllCategories();
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    if (!post) {
      navigate('/blog');
      return;
    }

    document.title = `${post.title} | Willow & Water Blog`;
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', post.metaDescription || post.excerpt);
    }

    // Update keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.name = 'keywords';
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.content = post.keywords?.join(', ') || '';

    // Article schema
    const existingSchema = document.querySelector('script[data-article-schema]');
    if (existingSchema) existingSchema.remove();

    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt,
      "image": post.image || "https://www.willowandwaterorganiccleaning.com/og-image.jpg",
      "url": `https://www.willowandwaterorganiccleaning.com/blog/${post.slug}`,
      "datePublished": post.publishDate,
      "dateModified": post.publishDate,
      "author": {
        "@type": "Organization",
        "name": post.author,
        "url": "https://www.willowandwaterorganiccleaning.com"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Willow & Water Organic Cleaning",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.willowandwaterorganiccleaning.com/logo.png"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://www.willowandwaterorganiccleaning.com/blog/${post.slug}`
      },
      "keywords": post.keywords?.join(', ')
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-article-schema', 'true');
    script.textContent = JSON.stringify(articleSchema);
    document.head.appendChild(script);

    // Scroll to top
    window.scrollTo(0, 0);

    return () => {
      const scriptToRemove = document.querySelector('script[data-article-schema]');
      if (scriptToRemove) scriptToRemove.remove();
    };
  }, [post, slug, navigate]);

  if (!post) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const shareUrl = `https://www.willowandwaterorganiccleaning.com/blog/${post.slug}`;
  const shareTitle = post.title;

  return (
    <div className="min-h-screen bg-bone">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-8 bg-gradient-to-b from-sage/10 to-bone">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm font-inter" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-charcoal/50">
              <li><Link to="/" className="hover:text-sage">Home</Link></li>
              <li>/</li>
              <li><Link to="/blog" className="hover:text-sage">Blog</Link></li>
              <li>/</li>
              <li className="text-charcoal truncate max-w-[200px]">{post.title}</li>
            </ol>
          </nav>

          <div className="flex items-center gap-3 mb-4">
            <Link 
              to={`/blog?category=${encodeURIComponent(post.category)}`}
              className="bg-sage/10 text-sage text-sm font-inter font-medium px-3 py-1 rounded-full hover:bg-sage/20 transition-colors"
            >
              {post.category}
            </Link>
            <span className="text-charcoal/40 text-sm font-inter flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {post.readTime}
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-playfair font-semibold text-charcoal mb-4">
            {post.title}
          </h1>
          
          <p className="text-lg text-charcoal/70 font-inter mb-6">
            {post.excerpt}
          </p>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 text-sm text-charcoal/60 font-inter">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(post.publishDate)}
              </span>
              <span>By {post.author}</span>
            </div>
            
            {/* Share buttons */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-charcoal/50 font-inter">Share:</span>
              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-charcoal/40 hover:text-sage hover:bg-sage/10 rounded-lg transition-colors"
                aria-label="Share on Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a 
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-charcoal/40 hover:text-sage hover:bg-sage/10 rounded-lg transition-colors"
                aria-label="Share on Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a 
                href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-charcoal/40 hover:text-sage hover:bg-sage/10 rounded-lg transition-colors"
                aria-label="Share on LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Image */}
      {post.image && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 mb-8">
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img 
              src={post.image} 
              alt={post.title}
              className="w-full h-64 sm:h-80 lg:h-96 object-cover"
            />
          </div>
        </div>
      )}

      {/* Article Content */}
      <article className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6 sm:p-10">
            <ContentRenderer content={post.content} />
            
            {/* In-Article CTA */}
            <ArticleCTA onBookClick={() => setShowBooking(true)} />
          </div>

          {/* Tags */}
          {post.keywords && post.keywords.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <Tag className="w-4 h-4 text-charcoal/40" />
              {post.keywords.map((keyword, index) => (
                <span 
                  key={index}
                  className="bg-charcoal/5 text-charcoal/60 text-xs font-inter px-3 py-1 rounded-full"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-playfair font-semibold text-charcoal mb-6">
              Related Articles
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map(relatedPost => (
                <Link 
                  key={relatedPost.slug}
                  to={`/blog/${relatedPost.slug}`}
                  className="bg-bone rounded-xl p-6 hover:shadow-md transition-shadow border border-charcoal/5"
                >
                  <span className="text-sage text-xs font-inter font-medium">
                    {relatedPost.category}
                  </span>
                  <h3 className="font-playfair font-semibold text-charcoal mt-2 mb-2 hover:text-sage transition-colors">
                    {relatedPost.title}
                  </h3>
                  <p className="text-charcoal/60 font-inter text-sm line-clamp-2">
                    {relatedPost.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-sage">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 text-bone px-4 py-2 rounded-full text-sm font-inter mb-4">
            <Sparkles className="w-4 h-4" />
            100% Non-Toxic Products
          </div>
          <h2 className="text-2xl sm:text-3xl font-playfair font-semibold text-bone mb-4">
            Ready to Experience Organic Cleaning?
          </h2>
          <p className="text-bone/80 font-inter mb-8 max-w-xl mx-auto">
            Join hundreds of Fox Valley families who trust Willow & Water for a cleaner, healthier home. Get your instant quote in under 60 seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => setShowBooking(true)}
              className="inline-flex items-center justify-center gap-2 bg-bone text-charcoal px-8 py-4 rounded-xl font-inter font-semibold hover:bg-bone/90 transition-colors shadow-lg"
            >
              <Calculator className="w-5 h-5" />
              Get Your Price & Book
            </button>
            <Link 
              to="/blog" 
              className="inline-flex items-center justify-center gap-2 bg-transparent text-bone border border-bone/30 px-8 py-4 rounded-xl font-inter font-medium hover:bg-bone/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Blog
            </Link>
          </div>
          <p className="text-bone/60 text-sm font-inter mt-4">
            No obligation • Free quotes • Instant pricing
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-charcoal py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-playfair text-xl font-semibold text-bone mb-3">
                Willow & Water
              </h3>
              <p className="text-bone/60 font-inter text-sm">
                Organic home cleaning for Fox Valley families. Safe for kids, pets, and the planet.
              </p>
            </div>
            
            <div>
              <h4 className="font-inter font-semibold text-bone mb-3">Blog Categories</h4>
              <ul className="space-y-2">
                {categories.map(category => (
                  <li key={category}>
                    <Link 
                      to={`/blog?category=${encodeURIComponent(category)}`}
                      className="text-bone/60 hover:text-bone font-inter text-sm"
                    >
                      {category}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-inter font-semibold text-bone mb-3">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/" className="text-bone/60 hover:text-bone font-inter text-sm">Home</Link></li>
                <li><Link to="/service-areas" className="text-bone/60 hover:text-bone font-inter text-sm">Service Areas</Link></li>
                <li><Link to="/blog" className="text-bone/60 hover:text-bone font-inter text-sm">Blog</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-inter font-semibold text-bone mb-3">Contact</h4>
              <ul className="space-y-2 text-bone/60 font-inter text-sm">
                <li><a href="tel:6302670096" className="hover:text-bone">(630) 267-0096</a></li>
                <li><a href="mailto:hello@willowandwaterorganiccleaning.com" className="hover:text-bone">hello@willowandwaterorganiccleaning.com</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-bone/10 pt-8 text-center">
            <p className="text-bone/40 font-inter text-sm">
              © {new Date().getFullYear()} Willow & Water Organic Cleaning. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Booking Flow Modal */}
      <BookingFlow 
        isOpen={showBooking} 
        onClose={() => setShowBooking(false)} 
      />
    </div>
  );
};

export default BlogPost;
