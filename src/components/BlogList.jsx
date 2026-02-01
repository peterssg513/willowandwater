import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, Search, Tag, ChevronRight } from 'lucide-react';
import Navbar from './Navbar';
import { getAllPosts, getFeaturedPosts, getAllCategories } from '../data/blogPosts';

const BlogList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const allPosts = getAllPosts();
  const featuredPosts = getFeaturedPosts();
  const categories = getAllCategories();

  // Filter posts
  const filteredPosts = allPosts.filter(post => {
    const matchesSearch = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    document.title = 'Blog | Willow & Water - Organic Cleaning Tips & Insights';
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 
        'Organic cleaning tips, eco-friendly living guides, and home care advice from Fox Valley\'s trusted organic cleaning service. Expert insights for healthier homes.'
      );
    }

    // Blog listing schema
    const existingSchema = document.querySelector('script[data-blog-schema]');
    if (existingSchema) existingSchema.remove();

    const blogSchema = {
      "@context": "https://schema.org",
      "@type": "Blog",
      "name": "Willow & Water Blog",
      "description": "Organic cleaning tips, eco-friendly living guides, and home care advice",
      "url": "https://willowandwater.com/blog",
      "publisher": {
        "@type": "Organization",
        "name": "Willow & Water Organic Cleaning",
        "url": "https://willowandwater.com"
      },
      "blogPost": allPosts.slice(0, 10).map(post => ({
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.excerpt,
        "url": `https://willowandwater.com/blog/${post.slug}`,
        "datePublished": post.publishDate,
        "author": {
          "@type": "Organization",
          "name": post.author
        }
      }))
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-blog-schema', 'true');
    script.textContent = JSON.stringify(blogSchema);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.querySelector('script[data-blog-schema]');
      if (scriptToRemove) scriptToRemove.remove();
    };
  }, [allPosts]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const PostCard = ({ post, featured = false }) => (
    <article className={`bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden hover:shadow-md transition-shadow ${featured ? 'md:col-span-2 md:grid md:grid-cols-2' : ''}`}>
      <div className={`${featured ? 'h-full min-h-[200px]' : 'h-48'} relative overflow-hidden bg-sage/10`}>
        {post.image ? (
          <img 
            src={post.image} 
            alt={post.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-sage/40 font-playfair text-lg">Willow & Water</span>
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="bg-sage/10 text-sage text-xs font-inter font-medium px-2.5 py-1 rounded-full">
            {post.category}
          </span>
          <span className="text-charcoal/40 text-xs font-inter flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {post.readTime}
          </span>
        </div>
        <Link to={`/blog/${post.slug}`}>
          <h2 className={`font-playfair font-semibold text-charcoal hover:text-sage transition-colors mb-3 ${featured ? 'text-2xl' : 'text-lg'}`}>
            {post.title}
          </h2>
        </Link>
        <p className="text-charcoal/60 font-inter text-sm mb-4 line-clamp-3">
          {post.excerpt}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-charcoal/40 text-xs font-inter flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(post.publishDate)}
          </span>
          <Link 
            to={`/blog/${post.slug}`}
            className="text-sage font-inter text-sm font-medium hover:underline flex items-center gap-1"
          >
            Read More
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </article>
  );

  return (
    <div className="min-h-screen bg-bone">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-12 bg-gradient-to-b from-sage/10 to-bone">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-playfair font-semibold text-charcoal mb-4">
              The Clean Living Blog
            </h1>
            <p className="text-lg text-charcoal/70 font-inter">
              Tips, guides, and insights for healthier homes and eco-friendly living in Fox Valley
            </p>
          </div>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="py-6 bg-white border-y border-charcoal/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl font-inter text-sm focus:outline-none focus:ring-2 focus:ring-sage"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-full text-sm font-inter font-medium transition-colors ${
                  selectedCategory === 'all' 
                    ? 'bg-sage text-white' 
                    : 'bg-charcoal/5 text-charcoal hover:bg-charcoal/10'
                }`}
              >
                All
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-inter font-medium transition-colors ${
                    selectedCategory === category 
                      ? 'bg-sage text-white' 
                      : 'bg-charcoal/5 text-charcoal hover:bg-charcoal/10'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {!searchQuery && selectedCategory === 'all' && featuredPosts.length > 0 && (
        <section className="py-12 bg-bone">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-playfair font-semibold text-charcoal mb-6">
              Featured Articles
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredPosts.slice(0, 2).map(post => (
                <PostCard key={post.slug} post={post} featured />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Posts */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-playfair font-semibold text-charcoal mb-6">
            {searchQuery ? `Search Results` : selectedCategory !== 'all' ? selectedCategory : 'All Articles'}
            <span className="text-charcoal/40 font-inter text-base font-normal ml-2">
              ({filteredPosts.length} {filteredPosts.length === 1 ? 'article' : 'articles'})
            </span>
          </h2>

          {filteredPosts.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map(post => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-charcoal/60 font-inter">
                No articles found matching your search.
              </p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="mt-4 text-sage hover:underline font-inter"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-sage">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-playfair font-semibold text-bone mb-4">
            Ready for a Cleaner, Healthier Home?
          </h2>
          <p className="text-bone/80 font-inter mb-6">
            Put these tips into action—or let us handle it for you with our organic cleaning service.
          </p>
          <Link 
            to="/#pricing" 
            className="inline-flex items-center gap-2 bg-bone text-charcoal px-8 py-4 rounded-lg font-inter font-medium hover:bg-bone/90 transition-colors"
          >
            Get Your Free Quote
            <ArrowRight className="w-5 h-5" />
          </Link>
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
                <li><Link to="/#pricing" className="text-bone/60 hover:text-bone font-inter text-sm">Get Quote</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-inter font-semibold text-bone mb-3">Contact</h4>
              <ul className="space-y-2 text-bone/60 font-inter text-sm">
                <li><a href="tel:6302670096" className="hover:text-bone">(630) 267-0096</a></li>
                <li><a href="mailto:hello@willowandwater.com" className="hover:text-bone">hello@willowandwater.com</a></li>
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
    </div>
  );
};

export default BlogList;
