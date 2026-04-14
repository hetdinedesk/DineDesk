import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCMS } from '../../contexts/CMSContext';
import { Users, Building2 } from 'lucide-react';

export default function TeamPage({ data, page, banner }) {
  const { homepageSections, teamDepartments, rawSettings } = useCMS();

  // Get team members from homeSections with type 'about'
  const teamMembers = homepageSections?.filter(s => s.type === 'about' && s.isActive !== false) || [];

  // Group team members by department
  const membersByDepartment = React.useMemo(() => {
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

  const [expandedDept, setExpandedDept] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  // Get page title and description from page data or default
  const pageTitle = page?.title || 'Meet Our Team';
  const pageSubtitle = page?.subtitle || 'Get to know the talented people behind our success';
  const pageContent = page?.content || '';

  // Banner image handling
  const bannerImg = banner?.imageUrl || page?.ogImage || null;

  return (
    <div className="min-h-screen">
      {/* Hero Banner - Full height with gradient or banner image */}
      <div
        className="relative flex items-center justify-center text-white overflow-hidden"
        style={{
          minHeight: '60vh',
          marginTop: 'calc(var(--header-offset, 5rem) * -1)',
          paddingTop: 'var(--header-offset, 5rem)',
          background: bannerImg ? 'transparent' : 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary, #8B5A2B) 100%)'
        }}
      >
        {bannerImg && (
          <>
            <img src={bannerImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/55" />
          </>
        )}

        {!bannerImg && (
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          />
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6"
            style={{
              fontFamily: 'var(--font-heading, inherit)',
              textShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}
          >
            {pageTitle}
          </h1>
          {pageSubtitle && (
            <p className="text-xl md:text-2xl max-w-2xl mx-auto opacity-90" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
              {pageSubtitle}
            </p>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 75C480 70 600 80 720 85C840 90 960 90 1080 85C1200 80 1320 70 1380 65L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </div>

      {/* Page content if provided */}
      {pageContent && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div
            className="prose prose-lg max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: pageContent }}
          />
        </div>
      )}

      {/* Department Tabs */}
      {Object.keys(membersByDepartment.grouped).length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="border-b border-gray-200">
            <div className="flex flex-wrap gap-0">
              <button
                onClick={() => setSelectedDepartment(null)}
                className={`px-6 py-3 font-medium transition-all border-b-2 ${
                  !selectedDepartment
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Departments
              </button>
              {Object.values(membersByDepartment.grouped)
                .sort((a, b) => (a.department.sortOrder || 0) - (b.department.sortOrder || 0))
                .map(({ department, members }) => (
                <button
                  key={department.id}
                  onClick={() => setSelectedDepartment(department.id)}
                  className={`px-6 py-3 font-medium transition-all border-b-2 ${
                    selectedDepartment === department.id
                      ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {department.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Team Members by Department */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {Object.keys(membersByDepartment.grouped).length === 0 && membersByDepartment.unassigned.length === 0 ? (
          <div className="text-center py-20">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-500">No team members added yet</h3>
            <p className="text-gray-400 mt-2">Check back soon to meet our amazing team!</p>
          </div>
        ) : (
          <>
            {/* Show all departments when none selected or show selected department */}
            {!selectedDepartment ? (
              <>
                {/* Departments */}
                {Object.values(membersByDepartment.grouped)
                  .sort((a, b) => (a.department.sortOrder || 0) - (b.department.sortOrder || 0))
                  .map(({ department, members }, index) => (
                  <div key={department.id} className="mb-16">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <div className="flex items-center gap-3 mb-8">
                        <Building2 size={24} className="text-blue-600" />
                        <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-heading, inherit)' }}>
                          {department.name}
                        </h2>
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {members.length} member{members.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {members.map((member, memberIndex) => (
                          <TeamMemberCard key={member.id} member={member} index={memberIndex} />
                        ))}
                      </div>
                    </motion.div>
                  </div>
                ))}

                {/* Unassigned Members */}
                {membersByDepartment.unassigned.length > 0 && (
                  <div className="mb-16">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="flex items-center gap-3 mb-8">
                        <Users size={24} className="text-gray-600" />
                        <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-heading, inherit)' }}>
                          Team Members
                        </h2>
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {membersByDepartment.unassigned.length} member{membersByDepartment.unassigned.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {membersByDepartment.unassigned.map((member, index) => (
                          <TeamMemberCard key={member.id} member={member} index={index} />
                        ))}
                      </div>
                    </motion.div>
                  </div>
                )}
              </>
            ) : (
              /* Show only selected department */
              (() => {
                const selected = membersByDepartment.grouped[selectedDepartment];
                if (!selected) return null;
                const { department, members } = selected;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="flex items-center gap-3 mb-8">
                      <Building2 size={24} className="text-blue-600" />
                      <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-heading, inherit)' }}>
                        {department.name}
                      </h2>
                      <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {members.length} member{members.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {members.map((member, memberIndex) => (
                        <TeamMemberCard key={member.id} member={member} index={memberIndex} />
                      ))}
                    </div>
                  </motion.div>
                );
              })()
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TeamMemberCard({ member, index }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group"
    >
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
        {/* Image */}
        <div className="relative h-64 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          {member.imageUrl ? (
            <img
              src={member.imageUrl}
              alt={member.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Users size={64} className="text-gray-300" />
            </div>
          )}
          {member.isActive === false && (
            <div className="absolute top-4 right-4">
              <span className="bg-gray-500 text-white text-xs px-3 py-1 rounded-full">
                Inactive
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-heading, inherit)' }}>
            {member.title}
          </h3>
          <p className="text-blue-600 font-medium mb-4">
            {typeof member.content === 'object' ? member.content?.text || '' : member.content}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
