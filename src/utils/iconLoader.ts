import { ReactComponent as ArrowDown } from '../assets/icons/arrow-down.svg';
import { ReactComponent as Check } from '../assets/icons/check.svg';
import { ReactComponent as Download } from '../assets/icons/download.svg';

export const iconMap: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  'arrow-down': ArrowDown,
  'check': Check,
  'download': Download,
};

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
}

export function Icon({ name, ...props }: IconProps) {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }
  
  return <IconComponent {...props} />;
}

