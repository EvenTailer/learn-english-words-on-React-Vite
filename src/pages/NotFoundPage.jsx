import { useNavigate } from 'react-router-dom';
import Button from '../shared/ui/Button';
import Card from '../shared/ui/Card';
import Icon from '../shared/ui/Icon';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <Card as="section" padding="lg" className={styles.card}>
        <p className={styles.code}>404</p>
        <p className={styles.text}>Такой страницы нет</p>
        <Button
          variant="primary"
          onClick={() => navigate('/')}
          icon={<Icon name="home" size={20} />}
          className={styles.action}
        >
          На главную
        </Button>
      </Card>
    </div>
  );
}
