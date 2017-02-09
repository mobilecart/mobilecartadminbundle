<?php

namespace MobileCart\AdminBundle;

use Symfony\Component\HttpKernel\Bundle\Bundle;

class MobileCartAdminBundle extends Bundle
{
    public function boot()
    {
        $this->container->get('cart.theme.config')
            ->setTheme(
                'admin',
                'MobileCartAdminBundle::admin-layout.html.twig',
                'MobileCartAdminBundle:',
                'bundles/mobilecartadmin'
            );
    }
}
