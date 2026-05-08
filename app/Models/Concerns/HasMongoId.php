<?php

namespace App\Models\Concerns;

/**
 * Expone el _id de Mongo como `id` (string) en JSON,
 * para que el frontend siga usando `model.id` sin cambios.
 */
trait HasMongoId
{
    public function toArray()
    {
        $array = parent::toArray();
        if (isset($array['_id'])) {
            $array['id'] = (string) $array['_id'];
        }
        return $array;
    }
}
