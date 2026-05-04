import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCMS } from '../../contexts/CMSContext';
import { Heart, Coffee, Instagram, Twitter, Linkedin, Building2, Users } from 'lucide-react';
import { replaceShortcodes } from '../../lib/shortcodes';

export default function TeamPage({ data, page, banner }) {
  const { homepageSections, teamDepartments, shortcodes, siteConfig } = useCMS();

  // Get team members from homeSections with type 'about'
  const teamMembers = homepageSections?.filter(s => s.type === 'about' && s.isActive !== false) || [];

  // Get page data with shortcodes
  const pageTitle = replaceShortcodes(page?.title || 'Meet the Artists', shortcodes);
  const pageSubtitle = replaceShortcodes(page?.subtitle || page?.metaDesc || 'The passionate minds dedicated to making your morning ritual an extraordinary experience.', shortcodes);
  const labelText = replaceShortcodes(page?.label || 'The Visionaries', shortcodes);

  // Banner image from CMS - use passed banner prop or find from banners array
  const pageBanner = banner || null;

  // Get team member specialty/skill from content or department
  const getSpecialty = (member) => {
    const content = typeof member.content === 'object' ? member.content : {};
    return content.specialty || content.skill || member.department?.name || '';
  };

  // Get bio from member content
  const getBio = (member) => {
    const content = typeof member.content === 'object' ? member.content : {};
    return content.bio || content.description || '';
  };

  // Get social links from content
  const getSocialLinks = (member) => {
    const content = typeof member.content === 'object' ? member.content : {};
    return {
      instagram: content.instagram || content.social?.instagram,
      twitter: content.twitter || content.social?.twitter,
      linkedin: content.linkedin || content.social?.linkedin,
    };
  };

  // Get member image
  const getMemberImage = (member) => {
    return member.imageUrl || member.content?.imageUrl || member.content?.image || '';
  };

  // Get member role from content
  const getMemberRole = (member) => {
    const content = typeof member.content === 'object' ? member.content : {};
    return content.role || content.position || '';
  };

  // Group team members by department
  const membersByDepartment = useMemo(() => {
    const grouped = {};
    const unassigned = [];

    teamMembers.forEach(member => {
      if (member.departmentIds && member.departmentIds.length > 0) {
        // Add member to each department they belong to
        member.departmentIds.forEach(deptId => {
          const dept = teamDepartments?.find(d => d.id === deptId && d.isActive !== false);
          if (dept) {
            if (!grouped[dept.id]) {
              grouped[dept.id] = {
                department: dept,
                members: []
              };
            }
            grouped[dept.id].members.push(member);
          }
        });
      } else {
        unassigned.push(member);
      }
    });

    return { grouped, unassigned };
  }, [teamMembers, teamDepartments]);

  // State for selected department
  const [selectedDepartment, setSelectedDepartment] = useState(() => {
    const depts = Object.values(membersByDepartment.grouped);
    if (depts.length > 0) {
      return depts.sort((a, b) => (a.department.sortOrder || 0) - (b.department.sortOrder || 0))[0].department.id;
    }
    return null;
  });

  // Get members to display (selected department or all unassigned)
  const membersToDisplay = selectedDepartment 
    ? (membersByDepartment.grouped[selectedDepartment]?.members || [])
    : membersByDepartment.unassigned;

  // Get department name for display
  const selectedDeptName = selectedDepartment 
    ? membersByDepartment.grouped[selectedDepartment]?.department?.name 
    : 'Team Members';

  return (
    <div className="min-h-screen bg-[var(--color-accent)]">
      {/* Hero Section */}
      <div className="bg-[var(--color-accent)] py-32 px-6 text-center border-b border-[var(--color-secondary)]/10 relative">
        {/* Optional Banner Background */}
        {pageBanner?.imageUrl && (
          <div className="absolute inset-0 z-0">
            <img 
              src={pageBanner.imageUrl} 
              alt="" 
              className="w-full h-full object-cover opacity-10"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-accent)] via-[var(--color-accent)]/90 to-[var(--color-accent)]"></div>
          </div>
        )}
        
        <div className="relative z-10 max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 text-[var(--color-primary)] font-bold uppercase tracking-[0.2em] text-sm mb-6"
          >
            <Heart width={16} height={16} fill="currentColor" />
            <span>{labelText}</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-6xl md:text-8xl font-bold text-[var(--color-secondary)] mb-6"
          >
            {pageTitle}
          </motion.h1>
          
          {pageSubtitle && (
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-2xl mx-auto text-[var(--color-secondary)]/70 text-lg leading-relaxed"
            >
              {pageSubtitle}
            </motion.p>
          )}
        </div>
      </div>

      {/* Team Grid */}
      <div className="max-w-7xl mx-auto py-24 px-6">
        {teamMembers.length === 0 ? (
          <div className="text-center py-32">
            <h3 className="font-serif text-3xl font-bold text-[var(--color-secondary)] mb-4">No team members added yet</h3>
            <p className="text-[var(--color-secondary)]/60">Check back soon to meet our amazing team!</p>
          </div>
        ) : (
          <>
            {/* Department Tabs - Only show if there are departments with members */}
            {Object.keys(membersByDepartment.grouped).length > 0 && (
              <div className="flex flex-wrap justify-center gap-3 mb-16">
                {Object.values(membersByDepartment.grouped)
                  .sort((a, b) => (a.department.sortOrder || 0) - (b.department.sortOrder || 0))
                  .map(({ department, members }) => (
                    <motion.button
                      key={department.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedDepartment(department.id)}
                      className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                        selectedDepartment === department.id
                          ? 'bg-[var(--color-primary)] text-[var(--color-secondary)] shadow-lg'
                          : 'bg-white text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/5 border border-[var(--color-secondary)]/10'
                      }`}
                    >
                      {department.name}
                      <span className="ml-2 text-sm opacity-75">({members.length})</span>
                    </motion.button>
                  ))}
                {membersByDepartment.unassigned.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDepartment(null)}
                    className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                      selectedDepartment === null
                        ? 'bg-[var(--color-primary)] text-[var(--color-secondary)] shadow-lg'
                        : 'bg-white text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/5 border border-[var(--color-secondary)]/10'
                    }`}
                  >
                    <Users size={16} className="inline mr-2" />
                    Others
                    <span className="ml-2 text-sm opacity-75">({membersByDepartment.unassigned.length})</span>
                  </motion.button>
                )}
              </div>
            )}

            {/* Department Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-center gap-3 mb-12"
            >
              {selectedDepartment ? (
                <>
                  <Building2 size={24} className="text-[var(--color-primary)]" />
                  <h2 className="font-serif text-3xl font-bold text-[var(--color-secondary)]">
                    {selectedDeptName}
                  </h2>
                </>
              ) : (
                <>
                  <Users size={24} className="text-[var(--color-primary)]" />
                  <h2 className="font-serif text-3xl font-bold text-[var(--color-secondary)]">
                    {selectedDeptName}
                  </h2>
                </>
              )}
              <span className="text-sm font-semibold text-[var(--color-secondary)]/50 bg-[var(--color-secondary)]/5 px-4 py-2 rounded-full">
                {membersToDisplay.length} member{membersToDisplay.length !== 1 ? 's' : ''}
              </span>
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={selectedDepartment || 'unassigned'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
              >
                {membersToDisplay.map((member, index) => {
                const specialty = getSpecialty(member);
                const bio = getBio(member);
                const socials = getSocialLinks(member);
                const hasSocials = socials.instagram || socials.twitter || socials.linkedin;
                
                const memberImage = getMemberImage(member);
                const memberRole = getMemberRole(member);

                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="group flex flex-col gap-6"
                  >
                    {/* Image Container */}
                    <div className="relative aspect-[3/4] rounded-[2rem] overflow-hidden shadow-xl">
                      <img
                        src={memberImage || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop'}
                        alt={member.title}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                      />
                      
                      {/* Gradient Overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-secondary)]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      {/* Social Links */}
                      {hasSocials && (
                        <div className="absolute bottom-6 left-6 right-6 flex justify-center gap-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                          {socials.instagram && (
                            <a 
                              href={socials.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-[var(--color-secondary)] flex items-center justify-center hover:bg-[var(--color-accent)] transition-colors"
                            >
                              <Instagram width={18} height={18} />
                            </a>
                          )}
                          {socials.twitter && (
                            <a 
                              href={socials.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-[var(--color-secondary)] flex items-center justify-center hover:bg-[var(--color-accent)] transition-colors"
                            >
                              <Twitter width={18} height={18} />
                            </a>
                          )}
                          {socials.linkedin && (
                            <a 
                              href={socials.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-[var(--color-secondary)] flex items-center justify-center hover:bg-[var(--color-accent)] transition-colors"
                            >
                              <Linkedin width={18} height={18} />
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="text-center space-y-2 group-hover:-translate-y-2 transition-transform duration-500">
                      {/* Specialty Tag */}
                      {specialty && (
                        <div className="flex items-center justify-center gap-2 text-[var(--color-primary)] font-bold text-[10px] uppercase tracking-widest">
                          <Coffee width={12} height={12} />
                          <span>{specialty}</span>
                        </div>
                      )}
                      
                      {/* Name */}
                      <h3 className="font-serif text-2xl font-bold text-[var(--color-secondary)] group-hover:text-[var(--color-primary)] transition-colors">
                        {member.title}
                      </h3>

                      {/* Role */}
                      {memberRole && (
                        <p className="text-[var(--color-secondary)]/40 font-bold uppercase text-[10px] tracking-[0.2em]">
                          {memberRole}
                        </p>
                      )}
                      
                      {/* Bio */}
                      {bio && (
                        <p className="text-[var(--color-secondary)]/60 text-sm leading-relaxed px-4 pt-2">
                          {bio}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              </motion.div>
            </AnimatePresence>

            {/* CTA Section - Uses siteConfig for careers link */}
            {siteConfig?.careers?.enabled !== false && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-32 p-12 md:p-20 rounded-[3rem] bg-[var(--color-secondary)] text-[var(--color-accent)] text-center relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary)]/10 blur-[100px] -mr-32 -mt-32"></div>
                <div className="relative z-10 space-y-8">
                  <h2 className="font-serif text-4xl md:text-6xl font-bold">
                    {replaceShortcodes(siteConfig?.careers?.heading || 'Join Our Team', shortcodes)}
                  </h2>
                  <p className="max-w-xl mx-auto text-[var(--color-accent)]/60 text-lg font-light">
                    {replaceShortcodes(siteConfig?.careers?.description || "We're always looking for passionate people to join our growing family.", shortcodes)}
                  </p>
                  <a
                    href={siteConfig?.careers?.url || '#careers'}
                    className="inline-block bg-[var(--color-primary)] text-[var(--color-secondary)] px-10 py-4 rounded-full font-bold text-lg hover:bg-[var(--color-accent)] transition-all duration-300"
                  >
                    {siteConfig?.careers?.buttonText || 'Apply Now'}
                  </a>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
