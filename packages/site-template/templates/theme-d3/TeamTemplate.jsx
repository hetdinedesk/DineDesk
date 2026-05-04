import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCMS } from '../../contexts/CMSContext';
import { Heart, Coffee, Instagram, Twitter, Linkedin, Sparkles, Flower2, Building2, Users } from 'lucide-react';
import { replaceShortcodes } from '../../lib/shortcodes';

export default function TeamPage({ data, page, banner }) {
  const { homepageSections, teamDepartments, shortcodes, siteConfig } = useCMS();

  // Get team members from homeSections with type 'about'
  const teamMembers = homepageSections?.filter(s => s.type === 'about' && s.isActive !== false) || [];

  // Get page data with shortcodes
  const pageTitle = replaceShortcodes(page?.title || 'Meet the Artists', shortcodes);
  const pageSubtitle = replaceShortcodes(page?.subtitle || page?.metaDesc || 'The passionate minds dedicated to making your morning ritual an extraordinary experience.', shortcodes);
  const labelText = replaceShortcodes(page?.label || 'The Visionaries', shortcodes);

  // Banner image from CMS - use passed banner prop
  const pageBanner = banner || null;

  // Get team member specialty/skill from content
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
      <div className="bg-[var(--color-secondary)] py-48 px-6 text-center text-[var(--color-accent)] relative overflow-hidden">
        {/* Background Image from CMS Banner */}
        <div className="absolute inset-0 z-0 opacity-20 mix-blend-overlay">
          <img 
            src={pageBanner?.imageUrl || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop'} 
            alt="" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative z-10 space-y-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-4 text-[var(--color-primary)] font-sans font-semibold uppercase tracking-[0.4em] text-[10px]">
            <Sparkles width={16} height={16} strokeWidth={2} />
            <span>{labelText}</span>
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-6xl md:text-[120px] leading-[0.8] tracking-tight"
          >
            {pageTitle}
          </motion.h1>
          
          {pageSubtitle && (
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-xl mx-auto text-[var(--color-accent)]/60 font-sans text-sm font-light leading-relaxed"
            >
              {pageSubtitle}
            </motion.p>
          )}
        </div>
      </div>

      {/* Team Grid */}
      <div className="max-w-7xl mx-auto py-32 px-6">
        {teamMembers.length === 0 ? (
          <div className="text-center py-32">
            <h3 className="font-serif text-3xl font-bold text-[var(--color-secondary)] mb-4">No team members added yet</h3>
            <p className="text-[var(--color-secondary)]/60">Check back soon to meet our amazing team!</p>
          </div>
        ) : (
          <>
            {/* Department Tabs - Only show if there are departments with members */}
            {Object.keys(membersByDepartment.grouped).length > 0 && (
              <div className="flex flex-wrap justify-center gap-4 mb-20">
                {Object.values(membersByDepartment.grouped)
                  .sort((a, b) => (a.department.sortOrder || 0) - (b.department.sortOrder || 0))
                  .map(({ department, members }) => (
                    <motion.button
                      key={department.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedDepartment(department.id)}
                      className={`px-8 py-4 rounded-full font-sans font-bold text-[10px] tracking-widest uppercase transition-all duration-500 ${
                        selectedDepartment === department.id
                          ? 'bg-[var(--color-primary)] text-[var(--color-accent)] shadow-xl'
                          : 'bg-white text-[var(--color-secondary)] hover:bg-[var(--color-primary)]/10 border border-[var(--color-secondary)]/10'
                      }`}
                    >
                      {department.name}
                      <span className="ml-2 opacity-60">({members.length})</span>
                    </motion.button>
                  ))}
                {membersByDepartment.unassigned.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDepartment(null)}
                    className={`px-8 py-4 rounded-full font-sans font-bold text-[10px] tracking-widest uppercase transition-all duration-500 ${
                      selectedDepartment === null
                        ? 'bg-[var(--color-primary)] text-[var(--color-accent)] shadow-xl'
                        : 'bg-white text-[var(--color-secondary)] hover:bg-[var(--color-primary)]/10 border border-[var(--color-secondary)]/10'
                    }`}
                  >
                    <Users size={14} className="inline mr-2" />
                    Others
                    <span className="ml-2 opacity-60">({membersByDepartment.unassigned.length})</span>
                  </motion.button>
                )}
              </div>
            )}

            {/* Department Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-center gap-4 mb-16"
            >
              {selectedDepartment ? (
                <>
                  <Building2 size={20} className="text-[var(--color-primary)]" strokeWidth={2} />
                  <h2 className="font-serif text-4xl italic text-[var(--color-secondary)]">
                    {selectedDeptName}
                  </h2>
                </>
              ) : (
                <>
                  <Users size={20} className="text-[var(--color-primary)]" strokeWidth={2} />
                  <h2 className="font-serif text-4xl italic text-[var(--color-secondary)]">
                    {selectedDeptName}
                  </h2>
                </>
              )}
              <span className="text-[10px] font-sans font-bold tracking-widest text-[var(--color-secondary)]/30 uppercase">
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
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12"
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
                    className="group flex flex-col gap-8"
                  >
                    {/* Image Container */}
                    <div className="relative aspect-[3/4] rounded-[48px] overflow-hidden shadow-xl transition-all duration-700 group-hover:-translate-y-2">
                      <img
                        src={memberImage || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop'}
                        alt={member.title}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                      
                      {/* Social Links Overlay */}
                      {hasSocials && (
                        <div className="absolute bottom-0 left-0 right-0 bg-[var(--color-primary)]/90 backdrop-blur-md p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-700">
                          <div className="flex justify-center gap-6">
                            {socials.instagram && (
                              <a 
                                href={socials.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--color-accent)] hover:text-[var(--color-secondary)] transition-colors duration-300"
                              >
                                <Instagram width={18} height={18} strokeWidth={2} />
                              </a>
                            )}
                            {socials.twitter && (
                              <a 
                                href={socials.twitter}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--color-accent)] hover:text-[var(--color-secondary)] transition-colors duration-300"
                              >
                                <Twitter width={18} height={18} strokeWidth={2} />
                              </a>
                            )}
                            {socials.linkedin && (
                              <a 
                                href={socials.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--color-accent)] hover:text-[var(--color-secondary)] transition-colors duration-300"
                              >
                                <Linkedin width={18} height={18} strokeWidth={2} />
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="space-y-4 px-4">
                      <div className="space-y-2">
                        <div className="text-[var(--color-primary)] font-sans font-bold text-[9px] uppercase tracking-widest">
                          {specialty}
                        </div>
                        <h3 className="font-serif text-3xl italic text-[var(--color-secondary)] group-hover:text-[var(--color-primary)] transition-colors duration-500">
                          {member.title}
                        </h3>
                        <p className="text-[var(--color-secondary)]/30 font-sans font-bold uppercase text-[9px] tracking-[0.2em]">
                          {memberRole}
                        </p>
                      </div>
                      <p className="text-[var(--color-secondary)]/60 font-sans text-xs font-light leading-relaxed">
                        {bio}
                      </p>
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
                className="mt-40 rounded-[64px] p-16 md:p-32 bg-white shadow-xl text-center relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-12 font-sans text-[10px] text-[var(--color-secondary)]/5 tracking-widest uppercase">Ref: Bloom-2026</div>
                <div className="relative z-10 space-y-12 max-w-2xl mx-auto">
                  <div className="inline-flex items-center gap-4 text-[var(--color-primary)] font-sans font-semibold uppercase tracking-[0.4em] text-[10px]">
                    <Flower2 width={24} height={24} strokeWidth={2} />
                  </div>
                  <h2 className="font-serif text-5xl md:text-8xl text-[var(--color-secondary)] leading-[0.9] tracking-tight">
                    {replaceShortcodes(siteConfig?.careers?.heading || 'Join Our Team', shortcodes)}
                  </h2>
                  <p className="font-sans text-sm font-light text-[var(--color-secondary)]/60 leading-relaxed uppercase tracking-[0.2em]">
                    {replaceShortcodes(siteConfig?.careers?.description || "We're always looking for passionate people to join our growing family.", shortcodes)}
                  </p>
                  <a
                    href={siteConfig?.careers?.url || '#careers'}
                    className="inline-block bg-[var(--color-primary)] text-[var(--color-accent)] px-12 py-5 rounded-full font-bold text-lg hover:bg-[var(--color-secondary)] transition-all duration-300"
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
