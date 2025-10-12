-- Ajouter une colonne pour marquer les avis comme répondus
ALTER TABLE reviews 
ADD COLUMN responded_at timestamp with time zone DEFAULT NULL;

-- Ajouter un index pour faciliter les requêtes
CREATE INDEX idx_reviews_responded_at ON reviews(responded_at) WHERE responded_at IS NULL;

-- Ajouter une colonne pour stocker la réponse utilisée
ALTER TABLE reviews 
ADD COLUMN ai_response_text text DEFAULT NULL;