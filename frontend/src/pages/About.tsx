export default function AboutPage() {
  return (
    <div className="relative min-h-screen w-full text-white font-body overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#120020] via-[#0b0116] to-black" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_10%,rgba(255,0,153,0.12),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(0,255,255,0.10),transparent_45%),radial-gradient(circle_at_50%_90%,rgba(138,43,226,0.10),transparent_40%)]" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-10 py-20 space-y-10">
        <h1 className="text-4xl md:text-5xl font-heading text-pink-300">
          Dreamer Big
        </h1>

        <section className="space-y-4">
          <h2 className="text-2xl font-heading text-indigo-300">What is Dreamer?</h2>
          <p className="text-lg text-indigo-200/90 font-body leading-relaxed">
            Dreamer is your personal academic command center. It helps you organize
            courses, manage study plans, track your progress, and connect with other students.
            It also incorporates AI tools to enhance your learning experience, making it easier
            to study smarter, not harder.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-heading text-indigo-300">How to Use</h2>
          <ul className="list-disc list-inside space-y-2 text-lg text-indigo-200/90">
            <li>
              <span className="text-pink-300 font-semibold">Create an account:</span> Sign up to
              unlock all features and save your progress. 
            </li>
            <li>
              <span className="text-pink-300 font-semibold">Add your courses:</span> Keep your
              subjects organized and quickly find related materials.
            </li>
            <li>
              <span className="text-pink-300 font-semibold">Upload notes:</span> Save up to 5 documents
              for quick AI summaries, practice quizzes, or just ask for an explanation on anything!
            </li>
            <li>
              <span className="text-pink-300 font-semibold">Generate AI content:</span> On any note,
              you can ask AI to summarize, explain, or turn it into quizzes with multiple choice
              and free response questions.
            </li>
            <li>
              <span className="text-pink-300 font-semibold">Track your stats:</span> See completion
              streaks, your top subjects, and progress rings in your profile.
            </li>
            <li>
              <span className="text-pink-300 font-semibold">Connect with others:</span> Search by
              users or courses to find potential study partners by emailing them directly.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-heading text-indigo-300">Why You'll Love It</h2>
          <p className="text-lg text-indigo-200/90 leading-relaxed">
            Dreamer exists to save you time and make studying easier and faster.
            Whether you need help understanding a concept, want to test yourself before an exam,
            or simply want a more organized approach to your workload, Dreamer's got you covered.
          </p>
        </section>
      </div>
    </div>
  );
}
