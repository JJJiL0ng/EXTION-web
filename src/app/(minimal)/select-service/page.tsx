'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, MessageSquare, Database } from 'lucide-react';
import { useEffect } from 'react';
import useUserIdStore from '@/_aaa_sheetChat/_aa_superRefactor/store/user/userIdStore';

export default function SelectServicePage() {
  const router = useRouter();
  const userId = useUserIdStore((state) => state.userId);

  useEffect(() => {
    if (!userId) {
      console.log('⚠️ [SelectServicePage] userId 없음 - /invite-check로 리다이렉트');
      router.push('/invite-check');
      return;
    }

    console.log('✅ [SelectServicePage] userId 존재:', userId);
  }, [userId, router]);

const services = [
    {
        title: 'EXTION AI',
        subtitle: 'for Korea',
        description: 'AI-powered spreadsheet editing and automation',
        notice: 'English version coming soon',
        icon: MessageSquare,
        route: '/trypage',
        gradient: 'from-blue-500 to-purple-600',
        hoverGradient: 'hover:from-blue-600 hover:to-purple-700',
    },
    {
        title: 'EXTION Schema Converter',
        subtitle: 'for Sellers',
        description: 'Schema conversion and data mapping automation',
        icon: Database,
        route: '/sctest',
        gradient: 'from-emerald-500 to-teal-600',
        hoverGradient: 'hover:from-emerald-600 hover:to-teal-700',
    },
];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choose Your Service
          </h1>
          <p className="text-lg text-gray-600">
            Select the Extion.ai service you want to use
          </p>
        </div>

        {/* Service Cards */}
        <div className="grid md:grid-cols-2 gap-8 px-4">
          {services.map((service) => {
            const IconComponent = service.icon;
            return (
              <div key={service.route} className="relative">
                {/* Notice Bubble - Outside Card */}
                {service.notice && (
                  <div className="absolute -top-10 left-6 z-20">
                    <div className={`relative inline-block bg-gradient-to-r ${service.gradient} rounded-2xl px-4 py-2 shadow-lg`}>
                      <p className="text-xs font-medium text-white whitespace-nowrap">
                        📢 {service.notice}
                      </p>
                      {/* Speech bubble tail */}
                      <div className={`absolute -bottom-2 left-6 w-4 h-4 bg-gradient-to-br ${service.gradient} transform rotate-45`}></div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => router.push(service.route)}
                  className={`group relative bg-white rounded-2xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl hover:scale-105 overflow-hidden w-full`}
                >
                {/* Background Gradient on Hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                />

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div
                    className={`w-16 h-16 mb-6 rounded-xl bg-gradient-to-br ${service.gradient} flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300`}
                  >
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {service.title}
                  </h2>
                  <p
                    className={`text-lg font-semibold bg-gradient-to-r ${service.gradient} bg-clip-text text-transparent mb-4`}
                  >
                    {service.subtitle}
                  </p>

                  {/* Description */}
                  <p className="text-gray-600 mb-6">{service.description}</p>

                  {/* Arrow Icon */}
                  <div className="flex items-center justify-end">
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${service.gradient} flex items-center justify-center transform group-hover:translate-x-2 transition-transform duration-300`}
                    >
                      <ArrowRight className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Border Glow Effect */}
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10`}
                />
              </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
