import { Heart, Leaf, Users, Shield, Check, Sparkles, Baby, Dog, Droplets } from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <>
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Story Side */}
            <div>
              <div className="inline-flex items-center gap-2 bg-sage/10 text-sage px-4 py-2 rounded-full mb-4">
                <Heart className="w-4 h-4" />
                <span className="font-inter text-sm font-medium">Our Story</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-playfair font-semibold text-charcoal mb-6">
                A Family Committed to <span className="text-sage">Clean Living</span>
              </h2>
              
              <div className="space-y-4 text-charcoal/70 font-inter leading-relaxed">
                <p>
                  It started with a simple question: 
                  <em className="text-charcoal"> what's actually in our cleaning products?</em>
                </p>
                <p>
                  The more we researched, the more alarmed we became. Harsh chemicals, 
                  synthetic fragrances, ingredients we couldn't pronounce—all lingering 
                  on the surfaces we touch every day in our own home.
                </p>
                <p>
                  We made a change, switching to plant-based, organic cleaning products. 
                  The difference was immediate. No more headaches from fumes. No more 
                  chemical residue. Just a clean, fresh home that felt truly healthy.
                </p>
                <p className="text-charcoal font-medium">
                  Willow & Water was born from that simple belief: every family deserves 
                  a spotless home without compromising their health.
                </p>
              </div>

              <div className="mt-8 flex items-center gap-4">
                <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center">
                  <span className="text-2xl">💚</span>
                </div>
                <div>
                  <p className="font-playfair font-semibold text-charcoal">Peter & Claira</p>
                  <p className="text-sm text-charcoal/60 font-inter">Founders, Willow & Water</p>
                </div>
              </div>
            </div>

            {/* Values Side */}
            <div className="bg-bone rounded-2xl p-6 sm:p-8">
              <h3 className="text-xl font-playfair font-semibold text-charcoal mb-6">
                What We Stand For
              </h3>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-sage/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Leaf className="w-5 h-5 text-sage" />
                  </div>
                  <div>
                    <h4 className="font-inter font-semibold text-charcoal mb-1">
                      100% Organic Products
                    </h4>
                    <p className="text-sm text-charcoal/60 font-inter">
                      We exclusively use Branch Basics—plant-based, non-toxic, and 
                      safe for children, pets, and the environment.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-sage/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-sage" />
                  </div>
                  <div>
                    <h4 className="font-inter font-semibold text-charcoal mb-1">
                      Fairly Paid Team
                    </h4>
                    <p className="text-sm text-charcoal/60 font-inter">
                      Our cleaners earn living wages. We believe in treating our 
                      team like family—because they are.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-sage/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-sage" />
                  </div>
                  <div>
                    <h4 className="font-inter font-semibold text-charcoal mb-1">
                      Fully Insured
                    </h4>
                    <p className="text-sm text-charcoal/60 font-inter">
                      Complete peace of mind with comprehensive insurance coverage 
                      for every cleaning visit.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-sage/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 text-sage" />
                  </div>
                  <div>
                    <h4 className="font-inter font-semibold text-charcoal mb-1">
                      Local & Personal
                    </h4>
                    <p className="text-sm text-charcoal/60 font-inter">
                      We're your neighbors in the Fox Valley. When you call, you 
                      talk to us—not a call center.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Branch Basics Section */}
      <section className="py-16 bg-gradient-to-b from-bone to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Product Image */}
            <div className="relative order-2 lg:order-1">
              <div className="relative">
                {/* Decorative background */}
                <div className="absolute -inset-4 bg-sage/5 rounded-3xl transform -rotate-3"></div>
                <div className="relative bg-white rounded-2xl shadow-xl p-6 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                  <img 
                    src="/branch-basics-products.webp" 
                    alt="Branch Basics organic cleaning products - the non-toxic cleaners we use in every home"
                    className="w-full h-auto rounded-xl"
                  />
                </div>
                {/* Floating badge */}
                <div className="absolute -top-4 -right-4 bg-sage text-white px-4 py-2 rounded-full shadow-lg">
                  <span className="font-inter text-sm font-semibold">100% Non-Toxic</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full mb-4">
                <Leaf className="w-4 h-4" />
                <span className="font-inter text-sm font-medium">Our Cleaning Products</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-playfair font-semibold text-charcoal mb-4">
                We Exclusively Use <span className="text-sage">Branch Basics</span>
              </h2>
              
              <p className="text-lg text-charcoal/70 font-inter mb-6">
                After testing dozens of "green" cleaners, we found the one that truly lives up to its promises. 
                Branch Basics is the <strong className="text-charcoal">only product</strong> we bring into your home.
              </p>

              {/* Why Branch Basics */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-inter font-semibold text-charcoal">Truly Non-Toxic</h4>
                    <p className="text-sm text-charcoal/60 font-inter">
                      Free from ALL harmful chemicals—no ammonia, bleach, phthalates, or synthetic fragrances. 
                      Just plant-based, mineral-derived ingredients.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Baby className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-inter font-semibold text-charcoal">Safe for Kids & Babies</h4>
                    <p className="text-sm text-charcoal/60 font-inter">
                      No residue left behind. Safe for crawling babies, curious toddlers, 
                      and anyone with chemical sensitivities or allergies.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Dog className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-inter font-semibold text-charcoal">Pet-Friendly Formula</h4>
                    <p className="text-sm text-charcoal/60 font-inter">
                      Cats and dogs can safely walk on cleaned floors and lick their paws 
                      without any risk of chemical exposure.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-inter font-semibold text-charcoal">Actually Works</h4>
                    <p className="text-sm text-charcoal/60 font-inter">
                      Powerful plant enzymes and surfactants tackle grease, grime, and bacteria 
                      just as effectively as harsh chemical cleaners.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-sage/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Droplets className="w-5 h-5 text-sage" />
                  </div>
                  <div>
                    <h4 className="font-inter font-semibold text-charcoal">EWG Verified & Certified</h4>
                    <p className="text-sm text-charcoal/60 font-inter">
                      Third-party verified by the Environmental Working Group. 
                      Made Without certified for the highest safety standards.
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/blog/branch-basics-review-why-we-use-it"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-sage text-white rounded-lg font-inter font-medium hover:bg-charcoal transition-colors"
                >
                  Read Our Full Review
                </Link>
                <a 
                  href="https://branchbasics.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-charcoal/20 text-charcoal rounded-lg font-inter font-medium hover:bg-bone transition-colors"
                >
                  Visit Branch Basics
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-16 pt-12 border-t border-charcoal/10">
            <div className="text-center mb-8">
              <p className="text-sm text-charcoal/50 font-inter uppercase tracking-wider">
                Why families trust Branch Basics
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-playfair font-bold text-sage mb-1">0</div>
                <p className="text-sm text-charcoal/60 font-inter">Harmful Chemicals</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-playfair font-bold text-sage mb-1">1</div>
                <p className="text-sm text-charcoal/60 font-inter">Concentrate Replaces 6+ Products</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-playfair font-bold text-sage mb-1">100%</div>
                <p className="text-sm text-charcoal/60 font-inter">Fragrance-Free</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-playfair font-bold text-sage mb-1">A+</div>
                <p className="text-sm text-charcoal/60 font-inter">EWG Safety Rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default About;
