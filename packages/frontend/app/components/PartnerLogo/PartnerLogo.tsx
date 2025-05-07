import { cn } from "../../../lib/utils";
import { ImageWithFallback } from "../ImageWithFallback";
import styles from "./PartnerLogo.module.css";

interface PartnerLogoProps {
  name: string;
  logo: string;
  url: string;
}

const PartnerLogo: React.FC<PartnerLogoProps> = ({ name, logo, url }) => {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.partner}
    >
      <ImageWithFallback
        src={logo}
        alt={name}
        className={"rounded mb-2 object-contain min-w-[150px]"}
      />
      <span className={styles.name}>{name}</span>
    </a>
  );
};

export default PartnerLogo;
