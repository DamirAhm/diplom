import type { Locale, JointPublication as JointPublicationType } from "@/app/types"

interface JointPublicationProps extends JointPublicationType {
  lang: Locale;
}

const JointPublication: React.FC<JointPublicationProps> = ({ 
  title, 
  authors, 
  journal,   
  year, 
  link: url, 
  lang 
}) => {
  return (
    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4 transition-colors duration-200">
      <h3 className="text-lg font-semibold mb-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          {title[lang]}
        </a>
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{authors}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {journal}, {year}
      </p>
    </div>
  )
}

export default JointPublication

